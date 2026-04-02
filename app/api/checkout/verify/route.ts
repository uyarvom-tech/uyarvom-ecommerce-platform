import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = await req.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) {
      console.error("RAZORPAY_KEY_SECRET is not defined")
      return NextResponse.json({ success: false, error: "Server configuration error" }, { status: 500 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: user.id,
      },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        paymentStatus: true,
        razorpayOrderId: true,
        razorpayPaymentId: true,
        razorpaySignature: true,
      },
    })

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    if (!order.razorpayOrderId || order.razorpayOrderId !== razorpay_order_id) {
      return NextResponse.json({ success: false, error: "Order mismatch" }, { status: 400 })
    }

    if (order.paymentStatus === "paid") {
      if (order.razorpayPaymentId === razorpay_payment_id) {
        return NextResponse.json({ success: true, orderNumber: order.orderNumber })
      }

      return NextResponse.json({ success: false, error: "Payment already confirmed" }, { status: 409 })
    }

    if (order.razorpayPaymentId && order.razorpayPaymentId === razorpay_payment_id && order.razorpaySignature === razorpay_signature) {
      return NextResponse.json({ success: true, orderNumber: order.orderNumber })
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`
    const expectedSignature = crypto.createHmac("sha256", secret).update(body).digest("hex")

    if (expectedSignature !== razorpay_signature) {
      console.warn(`Invalid signature attempt for order ${orderId}`)

      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "failed",
        },
      })

      await prisma.orderEvent.create({
        data: {
          orderId,
          type: "payment_failed",
          title: "Payment Verification Failed",
          description: "Payment signature could not be verified.",
        },
      })

      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 })
    }

    const updated = await prisma.order.updateMany({
      where: {
        id: orderId,
        userId: user.id,
        paymentStatus: { not: "paid" },
      },
      data: {
        paymentStatus: "paid",
        status: "confirmed",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
    })

    if (updated.count === 0) {
      return NextResponse.json({ success: false, error: "Payment already processed" }, { status: 409 })
    }

    const updatedOrder = await prisma.order.findFirstOrThrow({
      where: { id: orderId, userId: user.id },
      select: {
        orderNumber: true,
        total: true,
      },
    })

    await prisma.orderEvent.create({
      data: {
        orderId,
        type: "payment_success",
        title: "Payment Successful",
        description: `Payment of Rs.${updatedOrder.total.toLocaleString("en-IN")} received via Razorpay.`,
      },
    })

    return NextResponse.json({ success: true, orderNumber: updatedOrder.orderNumber })
  } catch (error: any) {
    console.error("Verification error:", error)
    return NextResponse.json({ success: false, error: error.message || "Verification failed" }, { status: 500 })
  }
}
