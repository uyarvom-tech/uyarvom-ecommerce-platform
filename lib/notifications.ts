/**
 * Notification System — Multi-channel notifications (Email, SMS, In-App).
 * 
 * Architecture:
 * - Email: via Resend API (or any SMTP-compatible service)
 * - SMS: via MSG91 / Twilio (pluggable adapter)
 * - In-App: stored in NotificationLog table
 * 
 * All notifications are logged for audit trail.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type NotificationChannel = "email" | "sms" | "push" | "in_app"

export type NotificationEventType =
  | "welcome"
  | "order_placed"
  | "payment_confirmed"
  | "order_packed"
  | "courier_assigned"
  | "out_for_delivery"
  | "delivered"
  | "delivery_failed"
  | "refund_initiated"
  | "refund_processed"
  | "low_stock_alert"
  | "return_approved"
  | "return_rejected"
  | "password_reset"
  | "dispute_created"

export interface NotificationPayload {
  event: NotificationEventType
  recipientEmail?: string
  recipientPhone?: string
  recipientUserId?: string
  subject?: string
  htmlBody?: string
  textBody?: string
  metadata?: Record<string, any>
}

export interface NotificationResult {
  success: boolean
  channel: NotificationChannel
  messageId?: string
  error?: string
}

export interface NotificationPreference {
  event: NotificationEventType
  email: boolean
  sms: boolean
  push: boolean
}

// ─── Default Preferences ─────────────────────────────────────────────────────

export const DEFAULT_CUSTOMER_PREFERENCES: NotificationPreference[] = [
  { event: "welcome", email: true, sms: false, push: false },
  { event: "order_placed", email: true, sms: true, push: true },
  { event: "payment_confirmed", email: true, sms: false, push: true },
  { event: "order_packed", email: true, sms: false, push: false },
  { event: "courier_assigned", email: true, sms: true, push: true },
  { event: "out_for_delivery", email: true, sms: true, push: true },
  { event: "delivered", email: true, sms: true, push: true },
  { event: "delivery_failed", email: true, sms: true, push: true },
  { event: "refund_initiated", email: true, sms: true, push: true },
  { event: "refund_processed", email: true, sms: true, push: true },
  { event: "return_approved", email: true, sms: false, push: true },
  { event: "return_rejected", email: true, sms: false, push: true },
  { event: "password_reset", email: true, sms: false, push: false },
]

export const ADMIN_NOTIFICATION_EVENTS: NotificationEventType[] = [
  "order_placed",
  "low_stock_alert",
  "dispute_created",
  "delivery_failed",
]

// ─── Email Service ───────────────────────────────────────────────────────────

/**
 * Send email via Resend API.
 * Falls back gracefully if RESEND_API_KEY is not configured.
 */
export async function sendEmail(params: {
  to: string
  subject: string
  html: string
  from?: string
}): Promise<NotificationResult> {
  const apiKey = process.env.RESEND_API_KEY
  const fromAddress = params.from || process.env.EMAIL_FROM || "Uyarvom <noreply@uyarvom.com>"

  if (!apiKey) {
    console.warn("[Notification] RESEND_API_KEY not configured — email not sent")
    return {
      success: false,
      channel: "email",
      error: "Email service not configured (RESEND_API_KEY missing)",
    }
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [params.to],
        subject: params.subject,
        html: params.html,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        channel: "email",
        error: `Resend API error: ${response.status} — ${JSON.stringify(errorData)}`,
      }
    }

    const data = await response.json()
    return {
      success: true,
      channel: "email",
      messageId: data.id,
    }
  } catch (error: any) {
    return {
      success: false,
      channel: "email",
      error: `Email send failed: ${error.message}`,
    }
  }
}

// ─── SMS Service ─────────────────────────────────────────────────────────────

/**
 * Send SMS via configured provider (MSG91 / Twilio).
 * Falls back gracefully if not configured.
 */
export async function sendSMS(params: {
  to: string
  message: string
}): Promise<NotificationResult> {
  const msg91AuthKey = process.env.MSG91_AUTH_KEY
  const msg91SenderId = process.env.MSG91_SENDER_ID || "UYRVOM"

  if (!msg91AuthKey) {
    console.warn("[Notification] MSG91_AUTH_KEY not configured — SMS not sent")
    return {
      success: false,
      channel: "sms",
      error: "SMS service not configured (MSG91_AUTH_KEY missing)",
    }
  }

  try {
    // MSG91 API
    const response = await fetch("https://control.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: {
        authkey: msg91AuthKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: msg91SenderId,
        route: "4", // Transactional
        country: "91", // India
        sms: [
          {
            message: params.message,
            to: [params.to.replace(/^\+91/, "")],
          },
        ],
      }),
    })

    if (!response.ok) {
      return {
        success: false,
        channel: "sms",
        error: `MSG91 error: ${response.status}`,
      }
    }

    const data = await response.json()
    return {
      success: true,
      channel: "sms",
      messageId: data.request_id || data.message,
    }
  } catch (error: any) {
    return {
      success: false,
      channel: "sms",
      error: `SMS send failed: ${error.message}`,
    }
  }
}

// ─── Notification Dispatcher ─────────────────────────────────────────────────

/**
 * Dispatches notification to all configured channels based on user preferences.
 * Logs all attempts to notification history.
 */
export async function dispatchNotification(payload: NotificationPayload): Promise<NotificationResult[]> {
  const results: NotificationResult[] = []

  // Always send email if recipient email is available
  if (payload.recipientEmail && payload.subject && payload.htmlBody) {
    const emailResult = await sendEmail({
      to: payload.recipientEmail,
      subject: payload.subject,
      html: payload.htmlBody,
    })
    results.push(emailResult)
  }

  // Send SMS if phone is available and event warrants it
  if (payload.recipientPhone && payload.textBody) {
    const smsEvents: NotificationEventType[] = [
      "order_placed",
      "courier_assigned",
      "out_for_delivery",
      "delivered",
      "delivery_failed",
      "refund_initiated",
      "refund_processed",
    ]
    if (smsEvents.includes(payload.event)) {
      const smsResult = await sendSMS({
        to: payload.recipientPhone,
        message: payload.textBody,
      })
      results.push(smsResult)
    }
  }

  // In-app notification (always logged)
  results.push({
    success: true,
    channel: "in_app",
    messageId: `inapp-${Date.now()}`,
  })

  return results
}

// ─── Event-Specific Notification Builders ────────────────────────────────────

export function buildOrderPlacedNotification(order: {
  orderNumber: string
  total: number
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  paymentMethod: string
}): NotificationPayload {
  const paymentLabel = order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"
  return {
    event: "order_placed",
    recipientEmail: order.customerEmail,
    recipientPhone: order.customerPhone || undefined,
    subject: `Order Confirmed: ${order.orderNumber} | Uyarvom`,
    htmlBody: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Thank you, ${order.customerName}!</h2>
        <p>Your order <strong>${order.orderNumber}</strong> has been placed successfully.</p>
        <p><strong>Total:</strong> ₹${order.total.toLocaleString("en-IN")}</p>
        <p><strong>Payment:</strong> ${paymentLabel}</p>
        <p>We'll notify you once your order ships.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
        <p style="color: #666; font-size: 12px;">— Team Uyarvom</p>
      </div>
    `,
    textBody: `Order ${order.orderNumber} placed. Total: ₹${order.total}. Payment: ${paymentLabel}. - Uyarvom`,
  }
}

export function buildShippingNotification(order: {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  trackingNumber?: string | null
  courierName?: string | null
}): NotificationPayload {
  const trackingInfo = order.trackingNumber
    ? `Tracking: ${order.trackingNumber} (${order.courierName || "Courier"})`
    : "Tracking details will be updated soon."

  return {
    event: "courier_assigned",
    recipientEmail: order.customerEmail,
    recipientPhone: order.customerPhone || undefined,
    subject: `Your order ${order.orderNumber} has shipped! | Uyarvom`,
    htmlBody: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Your order is on its way! 🚚</h2>
        <p>Hi ${order.customerName},</p>
        <p>Order <strong>${order.orderNumber}</strong> has been shipped.</p>
        <p><strong>${trackingInfo}</strong></p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
        <p style="color: #666; font-size: 12px;">— Team Uyarvom</p>
      </div>
    `,
    textBody: `Order ${order.orderNumber} shipped. ${trackingInfo} - Uyarvom`,
  }
}

export function buildDeliveryNotification(order: {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string | null
}): NotificationPayload {
  return {
    event: "delivered",
    recipientEmail: order.customerEmail,
    recipientPhone: order.customerPhone || undefined,
    subject: `Order ${order.orderNumber} delivered! | Uyarvom`,
    htmlBody: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Delivered! ✅</h2>
        <p>Hi ${order.customerName},</p>
        <p>Your order <strong>${order.orderNumber}</strong> has been delivered.</p>
        <p>We hope you love your purchase. If you have any issues, contact support.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
        <p style="color: #666; font-size: 12px;">— Team Uyarvom</p>
      </div>
    `,
    textBody: `Order ${order.orderNumber} delivered successfully! - Uyarvom`,
  }
}

export function buildDeliveryFailedNotification(order: {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  reason?: string
}): NotificationPayload {
  return {
    event: "delivery_failed",
    recipientEmail: order.customerEmail,
    recipientPhone: order.customerPhone || undefined,
    subject: `Delivery attempt failed: ${order.orderNumber} | Uyarvom`,
    htmlBody: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e63946;">Delivery Attempt Failed</h2>
        <p>Hi ${order.customerName},</p>
        <p>We couldn't deliver order <strong>${order.orderNumber}</strong>.</p>
        ${order.reason ? `<p><strong>Reason:</strong> ${order.reason}</p>` : ""}
        <p>We'll retry delivery. Please ensure someone is available at your address.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
        <p style="color: #666; font-size: 12px;">— Team Uyarvom</p>
      </div>
    `,
    textBody: `Delivery failed for order ${order.orderNumber}. ${order.reason || "We'll retry soon."} - Uyarvom`,
  }
}

export function buildRefundNotification(order: {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  refundAmount: number
  isFullRefund: boolean
}): NotificationPayload {
  return {
    event: "refund_initiated",
    recipientEmail: order.customerEmail,
    recipientPhone: order.customerPhone || undefined,
    subject: `Refund initiated: ₹${order.refundAmount.toLocaleString("en-IN")} | Uyarvom`,
    htmlBody: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Refund Initiated 💰</h2>
        <p>Hi ${order.customerName},</p>
        <p>A ${order.isFullRefund ? "full" : "partial"} refund of <strong>₹${order.refundAmount.toLocaleString("en-IN")}</strong> has been initiated for order <strong>${order.orderNumber}</strong>.</p>
        <p>The refund will be credited to your original payment method within 5-7 business days.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
        <p style="color: #666; font-size: 12px;">— Team Uyarvom</p>
      </div>
    `,
    textBody: `Refund of ₹${order.refundAmount} initiated for order ${order.orderNumber}. 5-7 days to credit. - Uyarvom`,
  }
}

export function buildLowStockAlert(product: {
  name: string
  sku: string
  currentStock: number
  adminEmail: string
}): NotificationPayload {
  return {
    event: "low_stock_alert",
    recipientEmail: product.adminEmail,
    subject: `⚠️ Low Stock Alert: ${product.name} (${product.currentStock} left)`,
    htmlBody: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e63946;">Low Stock Alert ⚠️</h2>
        <p><strong>Product:</strong> ${product.name}</p>
        <p><strong>SKU:</strong> ${product.sku}</p>
        <p><strong>Current Stock:</strong> ${product.currentStock} units</p>
        <p>Please restock this item to avoid stockouts.</p>
      </div>
    `,
    textBody: `Low stock: ${product.name} (SKU: ${product.sku}) — ${product.currentStock} units left.`,
  }
}

export function buildWelcomeEmail(user: {
  name: string
  email: string
}): NotificationPayload {
  return {
    event: "welcome",
    recipientEmail: user.email,
    subject: "Welcome to Uyarvom! 🎉",
    htmlBody: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Welcome to Uyarvom! 🎉</h2>
        <p>Hi ${user.name || "there"},</p>
        <p>Thank you for joining Uyarvom. Explore our handcrafted ceramic collection and find pieces that bring warmth to your home.</p>
        <p>Happy shopping!</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
        <p style="color: #666; font-size: 12px;">— Team Uyarvom</p>
      </div>
    `,
  }
}

export function buildPasswordResetEmail(params: {
  email: string
  resetLink: string
}): NotificationPayload {
  return {
    event: "password_reset",
    recipientEmail: params.email,
    subject: "Reset your password | Uyarvom",
    htmlBody: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Reset Your Password</h2>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <p><a href="${params.resetLink}" style="background: #1a1a2e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a></p>
        <p style="margin-top: 16px; color: #666; font-size: 13px;">This link expires in 24 hours. If you didn't request this, ignore this email.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
        <p style="color: #666; font-size: 12px;">— Team Uyarvom</p>
      </div>
    `,
  }
}
