import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

/**
 * POST /api/webhooks/razorpay
 * Handles Razorpay webhook events:
 * - payment.captured → auto-confirm order
 * - payment.failed → mark as failed, allow retry
 * - refund.processed → update order to refunded
 * - payment.dispute.created → alert admin (create support ticket)
 *
 * Security: Validates webhook signature using RAZORPAY_WEBHOOK_SECRET
 */
export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET not configured")
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
    }

    const rawBody = await request.text()
    const signature = request.headers.get("x-razorpay-signature") || ""

    // Verify HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex")

    if (!signature || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      console.warn("Invalid Razorpay webhook signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const event = JSON.parse(rawBody)
    const eventType = event.event as string

    switch (eventType) {
      case "payment.captured":
        await handlePaymentCaptured(event.payload.payment.entity)
        break
      case "payment.failed":
        await handlePaymentFailed(event.payload.payment.entity)
        break
      case "refund.processed":
        await handleRefundProcessed(event.payload.refund.entity)
        break
      case "payment.dispute.created":
        await handleDisputeCreated(event.payload.dispute.entity)
        break
      default:
        console.log(`Unhandled Razorpay webhook event: ${eventType}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Razorpay webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

/**
 * payment.captured → auto-confirm order, mark payment as paid
 */
async function handlePaymentCaptured(payment: any) {
  const razorpayOrderId = payment.order_id
  const razorpayPaymentId = payment.id

  if (!razorpayOrderId) return

  const order = await prisma.order.findFirst({
    where: { razorpayOrderId },
  })

  if (!order) {
    console.warn(`Webhook: No order found for razorpay_order_id=${razorpayOrderId}`)
    return
  }

  // Skip if already paid (idempotent)
  if (order.paymentStatus === "paid") return

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "paid",
        status: "confirmed",
        razorpayPaymentId,
      },
    }),
    prisma.orderEvent.create({
      data: {
        orderId: order.id,
        type: "payment_success",
        title: "Payment Captured (Webhook)",
        description: `Payment of ₹${order.total.toLocaleString("en-IN")} captured. Payment ID: ${razorpayPaymentId}`,
      },
    }),
  ])
}

/**
 * payment.failed → mark order payment as failed, allow retry
 */
async function handlePaymentFailed(payment: any) {
  const razorpayOrderId = payment.order_id
  const errorDescription = payment.error_description || "Payment failed"
  const errorCode = payment.error_code || "UNKNOWN"

  if (!razorpayOrderId) return

  const order = await prisma.order.findFirst({
    where: { razorpayOrderId },
  })

  if (!order) return

  // Don't overwrite successful payment
  if (order.paymentStatus === "paid") return

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "failed",
      },
    }),
    prisma.orderEvent.create({
      data: {
        orderId: order.id,
        type: "payment_failed",
        title: "Payment Failed (Webhook)",
        description: `Error: ${errorCode} — ${errorDescription}`,
      },
    }),
  ])
}

/**
 * refund.processed → update order to refunded
 */
async function handleRefundProcessed(refund: any) {
  const razorpayPaymentId = refund.payment_id
  const refundAmount = refund.amount / 100 // Razorpay sends in paise
  const refundId = refund.id

  if (!razorpayPaymentId) return

  const order = await prisma.order.findFirst({
    where: { razorpayPaymentId },
  })

  if (!order) {
    console.warn(`Webhook: No order found for payment_id=${razorpayPaymentId}`)
    return
  }

  // Check if full refund (refund amount >= order total)
  const isFullRefund = refundAmount >= order.total

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: isFullRefund ? "refunded" : "partially_refunded",
        returnStatus: isFullRefund ? "refunded" : order.returnStatus,
      },
    }),
    prisma.orderEvent.create({
      data: {
        orderId: order.id,
        type: "refund_processed",
        title: isFullRefund ? "Full Refund Processed" : "Partial Refund Processed",
        description: `₹${refundAmount.toLocaleString("en-IN")} refunded. Refund ID: ${refundId}`,
      },
    }),
  ])
}

/**
 * payment.dispute.created → alert admin by creating a support ticket
 */
async function handleDisputeCreated(dispute: any) {
  const razorpayPaymentId = dispute.payment_id
  const disputeAmount = (dispute.amount || 0) / 100
  const disputeReason = dispute.reason_code || "Unknown"

  if (!razorpayPaymentId) return

  const order = await prisma.order.findFirst({
    where: { razorpayPaymentId },
    select: { id: true, orderNumber: true, userId: true },
  })

  if (!order) return

  // Create a support ticket for the admin to handle
  await prisma.supportTicket.create({
    data: {
      ticketNumber: `DSP-${Date.now()}`,
      subject: `Payment Dispute: Order ${order.orderNumber}`,
      description: `A payment dispute has been raised for order ${order.orderNumber}.\n\nAmount: ₹${disputeAmount.toLocaleString("en-IN")}\nReason: ${disputeReason}\nPayment ID: ${razorpayPaymentId}\n\nPlease respond via Razorpay Dashboard.`,
      category: "payment",
      priority: "high",
      status: "open",
      customerId: order.userId,
      orderId: order.id,
    },
  })

  await prisma.orderEvent.create({
    data: {
      orderId: order.id,
      type: "dispute_created",
      title: "Payment Dispute Created",
      description: `Dispute of ₹${disputeAmount.toLocaleString("en-IN")} raised. Reason: ${disputeReason}`,
    },
  })
}
