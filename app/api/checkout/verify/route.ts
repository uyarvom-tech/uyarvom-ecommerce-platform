import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function POST(req: Request) {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = await req.json()

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
        }

        // 1. Verify signature
        const secret = process.env.RAZORPAY_KEY_SECRET
        if (!secret) {
            console.error("RAZORPAY_KEY_SECRET is not defined")
            return NextResponse.json({ success: false, error: "Server configuration error" }, { status: 500 })
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(body.toString())
            .digest("hex")

        const isSignatureValid = expectedSignature === razorpay_signature

        if (isSignatureValid) {
            // 2. Update order status
            const order = await prisma.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: "paid",
                    status: "confirmed",
                    razorpayPaymentId: razorpay_payment_id,
                    razorpaySignature: razorpay_signature,
                },
            })

            // 3. Add order event
            await prisma.orderEvent.create({
                data: {
                    orderId,
                    type: "payment_success",
                    title: "Payment Successful",
                    description: `Payment of ₹${order.total.toLocaleString("en-IN")} received via Razorpay.`,
                },
            })

            return NextResponse.json({ success: true, orderNumber: order.orderNumber })
        } else {
            // Log failed attempt but don't leak too much info
            console.warn(`Invalid signature attempt for order ${orderId}`)

            // Update order status to failed
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
    } catch (error: any) {
        console.error("Verification error:", error)
        return NextResponse.json({ success: false, error: error.message || "Verification failed" }, { status: 500 })
    }
}
