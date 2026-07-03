/**
 * Razorpay helper utilities — webhook validation, refund helpers, status mapping.
 */
import crypto from "crypto"

// ─── Webhook Signature Validation ─────────────────────────────────────────────

/**
 * Validates Razorpay webhook signature (HMAC-SHA256).
 * Used by /api/webhooks/razorpay route.
 */
export function validateWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  if (!body || !signature || !secret) return false

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex")

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch {
    return false
  }
}

/**
 * Validates Razorpay payment signature (order_id|payment_id).
 * Used by /api/checkout/verify route.
 */
export function validatePaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean {
  if (!orderId || !paymentId || !signature || !secret) return false

  const body = `${orderId}|${paymentId}`
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex")

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch {
    return false
  }
}

// ─── Razorpay Event Types ─────────────────────────────────────────────────────

export const RAZORPAY_EVENTS = {
  PAYMENT_CAPTURED: "payment.captured",
  PAYMENT_FAILED: "payment.failed",
  PAYMENT_AUTHORIZED: "payment.authorized",
  REFUND_PROCESSED: "refund.processed",
  REFUND_FAILED: "refund.failed",
  DISPUTE_CREATED: "payment.dispute.created",
  DISPUTE_WON: "payment.dispute.won",
  DISPUTE_LOST: "payment.dispute.lost",
} as const

export type RazorpayEvent = (typeof RAZORPAY_EVENTS)[keyof typeof RAZORPAY_EVENTS]

// ─── Payment Status Mapping ───────────────────────────────────────────────────

/**
 * Maps Razorpay payment status to our internal payment status.
 */
export function mapRazorpayStatus(rzpStatus: string): string {
  switch (rzpStatus) {
    case "created":
      return "pending"
    case "authorized":
      return "authorized"
    case "captured":
      return "paid"
    case "failed":
      return "failed"
    case "refunded":
      return "refunded"
    default:
      return "pending"
  }
}

// ─── Refund Helpers ───────────────────────────────────────────────────────────

/**
 * Determines if an order is eligible for refund.
 */
export function isRefundEligible(order: {
  paymentStatus: string
  paymentMethod: string
  razorpayPaymentId: string | null
  status: string
}): { eligible: boolean; reason?: string } {
  if (order.paymentMethod === "cod") {
    return { eligible: false, reason: "COD orders cannot be refunded via Razorpay" }
  }

  if (!order.razorpayPaymentId) {
    return { eligible: false, reason: "No payment captured for this order" }
  }

  if (order.paymentStatus === "refunded") {
    return { eligible: false, reason: "Order already fully refunded" }
  }

  if (order.paymentStatus !== "paid" && order.paymentStatus !== "partially_refunded") {
    return { eligible: false, reason: `Cannot refund order with status: ${order.paymentStatus}` }
  }

  return { eligible: true }
}

/**
 * Determines if a payment retry is allowed.
 */
export function isRetryAllowed(order: {
  paymentStatus: string
  paymentMethod: string
  status: string
  createdAt: Date | string
}): { allowed: boolean; reason?: string } {
  if (order.paymentStatus === "paid") {
    return { allowed: false, reason: "Payment already completed" }
  }

  if (order.paymentMethod === "cod") {
    return { allowed: false, reason: "COD order - no online payment needed" }
  }

  if (order.status === "cancelled") {
    return { allowed: false, reason: "Order has been cancelled" }
  }

  const orderAge = Date.now() - new Date(order.createdAt).getTime()
  const MAX_RETRY_WINDOW = 24 * 60 * 60 * 1000 // 24 hours
  if (orderAge > MAX_RETRY_WINDOW) {
    return { allowed: false, reason: "Payment retry window expired (24h)" }
  }

  return { allowed: true }
}

// ─── Amount Helpers ───────────────────────────────────────────────────────────

/**
 * Converts rupees to paise (Razorpay uses paise).
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100)
}

/**
 * Converts paise to rupees.
 */
export function paiseToRupees(paise: number): number {
  return paise / 100
}
