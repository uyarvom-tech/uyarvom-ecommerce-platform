import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import Razorpay from "razorpay"

function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  })
}

/**
 * POST /api/orders/[id]/retry-payment
 * Customer-facing endpoint to retry payment for a failed/pending order.
 * Creates a new Razorpay order and returns checkout details.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const order = await prisma.order.findFirst({
      where: {
        id,
        userId: user.id,
      },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        paymentStatus: true,
        paymentMethod: true,
        status: true,
        shippingName: true,
        shippingEmail: true,
        shippingPhone: true,
        createdAt: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Only allow retry for failed or pending payments
    if (order.paymentStatus === "paid") {
      return NextResponse.json(
        { error: "Payment already completed for this order." },
        { status: 400 }
      )
    }

    if (order.paymentMethod === "cod") {
      return NextResponse.json(
        { error: "This is a Cash on Delivery order. No online payment required." },
        { status: 400 }
      )
    }

    if (order.status === "cancelled") {
      return NextResponse.json(
        { error: "This order has been cancelled. Cannot retry payment." },
        { status: 400 }
      )
    }

    // Check if order is older than 24 hours (Razorpay order expires after ~30 min, so we create new one)
    const orderAge = Date.now() - new Date(order.createdAt).getTime()
    const MAX_RETRY_WINDOW = 24 * 60 * 60 * 1000 // 24 hours
    if (orderAge > MAX_RETRY_WINDOW) {
      return NextResponse.json(
        { error: "Payment retry window has expired (24 hours). Please place a new order." },
        { status: 400 }
      )
    }

    // Create a new Razorpay order for the retry
    const razorpayOrder = (await getRazorpay().orders.create({
      amount: Math.round(order.total * 100), // In paise
      currency: "INR",
      receipt: `${order.orderNumber}-RETRY-${Date.now()}`,
      notes: {
        order_id: order.id,
        retry: "true",
      },
    })) as any

    // Update order with new Razorpay order ID
    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: {
          razorpayOrderId: razorpayOrder.id,
          paymentStatus: "pending", // Reset to pending on retry
        },
      }),
      prisma.orderEvent.create({
        data: {
          orderId: order.id,
          type: "payment_retry",
          title: "Payment Retry Initiated",
          description: `Customer initiated payment retry. New Razorpay Order: ${razorpayOrder.id}`,
          actorId: user.id,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      orderId: order.id,
      customerName: order.shippingName,
      customerEmail: order.shippingEmail || user.email,
      customerPhone: order.shippingPhone,
    })
  } catch (error: any) {
    console.error("Payment retry error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to initiate payment retry" },
      { status: 500 }
    )
  }
}
