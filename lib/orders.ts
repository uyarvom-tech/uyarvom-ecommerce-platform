/**
 * Order Management — Core business logic
 * Handles order state machine, validation, split shipments, exchanges, and email templates.
 */

// ─── Order Status State Machine ──────────────────────────────────────────────

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'failed' | 'refunded'
export type FulfillmentStatus = 'unfulfilled' | 'partially_fulfilled' | 'fulfilled' | 'shipped' | 'delivered' | 'returned' | 'cancelled'
export type ReturnStatus = 'none' | 'requested' | 'approved' | 'rejected' | 'received' | 'refunded'

/** Valid status transitions for the order state machine */
const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'processing', 'cancelled'],
  confirmed: ['processing', 'shipped', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [], // Terminal state (returns handled separately)
  cancelled: [], // Terminal state
}

/**
 * Validate whether a status transition is allowed.
 */
export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true // No change is always valid
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false
}

/**
 * Get all possible next statuses from the current status.
 */
export function getNextStatuses(current: OrderStatus): OrderStatus[] {
  return ORDER_TRANSITIONS[current] || []
}

/**
 * Check if an order can be cancelled.
 */
export function canCancel(status: OrderStatus): boolean {
  return ['pending', 'confirmed', 'processing'].includes(status)
}

/**
 * Check if an order can have a return requested.
 */
export function canReturn(status: OrderStatus, deliveredAt: Date | null, returnWindowDays: number = 7): boolean {
  if (status !== 'delivered') return false
  if (!deliveredAt) return false
  const daysSince = (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24)
  return daysSince <= returnWindowDays
}

// ─── Split Shipments ─────────────────────────────────────────────────────────

export interface ShipmentItem {
  orderItemId: string
  quantity: number
}

export interface Shipment {
  items: ShipmentItem[]
  trackingNumber?: string
  courierName?: string
}

/**
 * Validate a partial shipment against order items.
 */
export function validateSplitShipment(
  orderItems: Array<{ id: string; quantity: number; shippedQuantity?: number }>,
  shipmentItems: ShipmentItem[]
): { valid: boolean; error?: string } {
  if (!shipmentItems.length) {
    return { valid: false, error: 'At least one item must be included in the shipment' }
  }

  for (const shipItem of shipmentItems) {
    const orderItem = orderItems.find((oi) => oi.id === shipItem.orderItemId)
    if (!orderItem) {
      return { valid: false, error: `Order item ${shipItem.orderItemId} not found` }
    }

    if (shipItem.quantity <= 0) {
      return { valid: false, error: 'Shipment quantity must be positive' }
    }

    const alreadyShipped = orderItem.shippedQuantity || 0
    const remaining = orderItem.quantity - alreadyShipped
    if (shipItem.quantity > remaining) {
      return { valid: false, error: `Cannot ship ${shipItem.quantity} of item ${shipItem.orderItemId}. Only ${remaining} remaining.` }
    }
  }

  return { valid: true }
}

/**
 * Calculate fulfillment status based on shipped quantities.
 */
export function calculateFulfillmentStatus(
  orderItems: Array<{ quantity: number; shippedQuantity?: number }>
): FulfillmentStatus {
  const totalQty = orderItems.reduce((sum, item) => sum + item.quantity, 0)
  const shippedQty = orderItems.reduce((sum, item) => sum + (item.shippedQuantity || 0), 0)

  if (shippedQty === 0) return 'unfulfilled'
  if (shippedQty < totalQty) return 'partially_fulfilled'
  return 'fulfilled'
}

// ─── Backorder ───────────────────────────────────────────────────────────────

export interface BackorderItem {
  productId: string
  variantId: string
  requestedQty: number
  availableQty: number
  backorderQty: number
}

/**
 * Identify items that need to be backordered due to insufficient stock.
 */
export function identifyBackorders(
  items: Array<{ productId: string; variantId: string; requestedQty: number; availableStock: number }>
): BackorderItem[] {
  return items
    .filter((item) => item.requestedQty > item.availableStock)
    .map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      requestedQty: item.requestedQty,
      availableQty: item.availableStock,
      backorderQty: item.requestedQty - item.availableStock,
    }))
}

// ─── Exchange ────────────────────────────────────────────────────────────────

export type ExchangeReason = 'wrong_size' | 'wrong_color' | 'defective' | 'changed_mind' | 'other'

export const EXCHANGE_REASONS: { value: ExchangeReason; label: string }[] = [
  { value: 'wrong_size', label: 'Wrong Size' },
  { value: 'wrong_color', label: 'Wrong Color' },
  { value: 'defective', label: 'Defective / Damaged' },
  { value: 'changed_mind', label: 'Changed Mind' },
  { value: 'other', label: 'Other' },
]

/**
 * Validate exchange eligibility.
 */
export function canExchange(
  orderStatus: OrderStatus,
  deliveredAt: Date | null,
  exchangeWindowDays: number = 7
): { eligible: boolean; reason?: string } {
  if (orderStatus !== 'delivered') {
    return { eligible: false, reason: 'Only delivered orders can be exchanged' }
  }
  if (!deliveredAt) {
    return { eligible: false, reason: 'Delivery date not recorded' }
  }
  const daysSince = (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24)
  if (daysSince > exchangeWindowDays) {
    return { eligible: false, reason: `Exchange window (${exchangeWindowDays} days) has expired` }
  }
  return { eligible: true }
}

// ─── Order Number Generation ─────────────────────────────────────────────────

export function generateOrderNumber(): string {
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
}

// ─── Email Templates ─────────────────────────────────────────────────────────

export interface OrderEmailData {
  orderNumber: string
  customerName: string
  customerEmail: string
  items: Array<{ name: string; variant: string; quantity: number; price: number }>
  subtotal: number
  tax: number
  shipping: number
  total: number
  shippingAddress: string
  paymentMethod: string
  trackingNumber?: string
  courierName?: string
}

/**
 * Generate order confirmation email HTML.
 */
export function generateOrderConfirmationEmail(data: OrderEmailData): { subject: string; html: string } {
  const itemRows = data.items
    .map(
      (item) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #eee">${item.name} (${item.variant})</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₹${item.price.toLocaleString('en-IN')}</td></tr>`
    )
    .join('')

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Order Confirmation</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:20px;background:#f5f5f5">
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
    <div style="background:#000;color:white;padding:24px;text-align:center">
      <h1 style="margin:0;font-size:20px;letter-spacing:2px">UYARVOM</h1>
      <p style="margin:8px 0 0;font-size:12px;opacity:0.7;letter-spacing:1px">ORDER CONFIRMATION</p>
    </div>
    <div style="padding:32px">
      <p style="margin:0 0 16px">Hi <strong>${data.customerName}</strong>,</p>
      <p style="margin:0 0 24px;color:#666">Thank you for your order! Here's your order summary:</p>
      
      <div style="background:#f9f9f9;border-radius:4px;padding:16px;margin-bottom:24px">
        <p style="margin:0;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:1px">Order Number</p>
        <p style="margin:4px 0 0;font-size:18px;font-weight:bold">#${data.orderNumber}</p>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <thead>
          <tr style="background:#f5f5f5">
            <th style="padding:8px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px">Item</th>
            <th style="padding:8px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:1px">Qty</th>
            <th style="padding:8px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:1px">Price</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <div style="border-top:2px solid #000;padding-top:16px;margin-bottom:24px">
        <table style="width:100%">
          <tr><td style="padding:4px 0;color:#666">Subtotal</td><td style="text-align:right">₹${data.subtotal.toLocaleString('en-IN')}</td></tr>
          <tr><td style="padding:4px 0;color:#666">Tax (GST)</td><td style="text-align:right">₹${data.tax.toLocaleString('en-IN')}</td></tr>
          <tr><td style="padding:4px 0;color:#666">Shipping</td><td style="text-align:right">${data.shipping === 0 ? 'FREE' : '₹' + data.shipping.toLocaleString('en-IN')}</td></tr>
          <tr style="font-weight:bold;font-size:16px"><td style="padding:12px 0 0;border-top:1px solid #eee">Total</td><td style="text-align:right;padding:12px 0 0;border-top:1px solid #eee">₹${data.total.toLocaleString('en-IN')}</td></tr>
        </table>
      </div>

      <div style="background:#f9f9f9;border-radius:4px;padding:16px;margin-bottom:16px">
        <p style="margin:0;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:1px">Shipping Address</p>
        <p style="margin:8px 0 0">${data.shippingAddress}</p>
      </div>

      <div style="background:#f9f9f9;border-radius:4px;padding:16px">
        <p style="margin:0;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:1px">Payment Method</p>
        <p style="margin:8px 0 0;font-weight:bold">${data.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
      </div>
    </div>
    <div style="background:#f5f5f5;padding:20px;text-align:center;font-size:12px;color:#999">
      <p style="margin:0">Questions? Reply to this email or contact us at support@uyarvom.com</p>
    </div>
  </div>
</body>
</html>`

  return {
    subject: `Order Confirmed — #${data.orderNumber}`,
    html,
  }
}

/**
 * Generate shipping notification email HTML.
 */
export function generateShippingEmail(data: OrderEmailData): { subject: string; html: string } {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Order Shipped</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:20px;background:#f5f5f5">
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
    <div style="background:#000;color:white;padding:24px;text-align:center">
      <h1 style="margin:0;font-size:20px;letter-spacing:2px">UYARVOM</h1>
      <p style="margin:8px 0 0;font-size:12px;opacity:0.7;letter-spacing:1px">YOUR ORDER IS ON ITS WAY</p>
    </div>
    <div style="padding:32px">
      <p style="margin:0 0 16px">Hi <strong>${data.customerName}</strong>,</p>
      <p style="margin:0 0 24px;color:#666">Your order <strong>#${data.orderNumber}</strong> has been shipped!</p>
      
      ${data.trackingNumber ? `
      <div style="background:#f0f7ff;border:1px solid #b3d7ff;border-radius:4px;padding:16px;margin-bottom:24px">
        <p style="margin:0;font-size:12px;color:#0066cc;text-transform:uppercase;letter-spacing:1px">Tracking Details</p>
        <p style="margin:8px 0 0;font-weight:bold;font-size:16px">${data.trackingNumber}</p>
        <p style="margin:4px 0 0;color:#666">via ${data.courierName || 'Courier'}</p>
      </div>` : ''}

      <div style="background:#f9f9f9;border-radius:4px;padding:16px">
        <p style="margin:0;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:1px">Delivering To</p>
        <p style="margin:8px 0 0">${data.shippingAddress}</p>
      </div>
    </div>
    <div style="background:#f5f5f5;padding:20px;text-align:center;font-size:12px;color:#999">
      <p style="margin:0">Track your order at uyarvom.com/track</p>
    </div>
  </div>
</body>
</html>`

  return {
    subject: `Your Order #${data.orderNumber} Has Been Shipped!`,
    html,
  }
}
