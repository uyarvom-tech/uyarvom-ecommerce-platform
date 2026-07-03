import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireStaffAccess } from "@/lib/auth-middleware"
import Razorpay from "razorpay"

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
})

/**
 * POST /api/admin/orders/[id]/refund
 * Admin-initiated refund via Razorpay API.
 * Body: { amount?: number, reason?: string }
 * - If amount is omitted, full refund is issued.
 * - Partial refunds are supported.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireStaffAccess()
    if (ctx instanceof NextResponse) return ctx

    const { id } = await params
    const body = await request.json()
    const { amount, reason } = body as { amount?: number; reason?: string }

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        paymentStatus: true,
        paymentMethod: true,
        razorpayPaymentId: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.paymentMethod === "cod") {
      return NextResponse.json(
        { error: "Cannot refund COD orders via Razorpay. Handle manually." },
        { status: 400 }
      )
    }

    if (!order.razorpayPaymentId) {
      return NextResponse.json(
        { error: "No Razorpay payment ID found for this order. Payment may not have been captured." },
        { status: 400 }
      )
    }

    if (order.paymentStatus === "refunded") {
      return NextResponse.json(
        { error: "Order has already been fully refunded." },
        { status: 409 }
      )
    }

    if (order.paymentStatus !== "paid" && order.paymentStatus !== "partially_refunded") {
      return NextResponse.json(
        { error: `Cannot refund order with payment status: ${order.paymentStatus}` },
        { status: 400 }
      )
    }

    // Determine refund amount (in paise for Razorpay)
    const refundAmountRupees = amount && amount > 0 ? Math.min(amount, order.total) : order.total
    const refundAmountPaise = Math.round(refundAmountRupees * 100)

    // Initiate refund via Razorpay API
    const refund = await (razorpay.payments as any).refund(order.razorpayPaymentId, {
      amount: refundAmountPaise,
      notes: {
        order_id: order.id,
        order_number: order.orderNumber,
        reason: reason || "Admin initiated refund",
        initiated_by: ctx.authUser.id,
      },
    })

    const isFullRefund = refundAmountRupees >= order.total

    // Update order status
    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: isFullRefund ? "refunded" : "partially_refunded",
          status: isFullRefund ? "cancelled" : order.paymentStatus,
          returnStatus: isFullRefund ? "refunded" : undefined,
        },
      }),
      prisma.orderEvent.create({
        data: {
          orderId: order.id,
          type: "refund_initiated",
          title: isFullRefund ? "Full Refund Initiated" : "Partial Refund Initiated",
          description: `₹${refundAmountRupees.toLocaleString("en-IN")} refund initiated by admin. Razorpay Refund ID: ${refund.id}. Reason: ${reason || "Not specified"}`,
          actorId: ctx.authUser.id,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      refundId: refund.id,
      amount: refundAmountRupees,
      status: refund.status,
      isFullRefund,
    })
  } catch (error: any) {
    console.error("Refund error:", error)

    // Handle Razorpay-specific errors
    if (error.statusCode) {
      return NextResponse.json(
        { error: error.error?.description || "Razorpay refund failed" },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { error: error.message || "Refund processing failed" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/orders/[id]/refund
 * Get refund status for an order from Razorpay.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireStaffAccess()
    if (ctx instanceof NextResponse) return ctx

    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        razorpayPaymentId: true,
        paymentStatus: true,
        total: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (!order.razorpayPaymentId) {
      return NextResponse.json({ refunds: [], totalRefunded: 0 })
    }

    // Fetch refunds from Razorpay
    const refunds = await (razorpay.payments as any).fetchMultipleRefund(order.razorpayPaymentId)

    const totalRefunded = (refunds.items || []).reduce(
      (sum: number, r: any) => sum + (r.amount || 0) / 100,
      0
    )

    return NextResponse.json({
      refunds: (refunds.items || []).map((r: any) => ({
        id: r.id,
        amount: r.amount / 100,
        status: r.status,
        createdAt: r.created_at ? new Date(r.created_at * 1000).toISOString() : null,
      })),
      totalRefunded,
      orderTotal: order.total,
      paymentStatus: order.paymentStatus,
    })
  } catch (error: any) {
    console.error("Fetch refunds error:", error)
    return NextResponse.json(
      { error: "Failed to fetch refund details" },
      { status: 500 }
    )
  }
}
