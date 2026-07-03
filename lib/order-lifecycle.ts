/**
 * Enhanced Order Lifecycle — Full 14-stage workflow
 * Pick lists, packing slips, extended status codes, barcode scanning.
 */

// ─── Extended Order Status ───────────────────────────────────────────────────

export type ExtendedOrderStatus =
  | 'pending_payment' | 'payment_confirmed' | 'order_received'
  | 'processing' | 'packaging' | 'ready_for_pickup'
  | 'courier_assigned' | 'picked_up' | 'in_transit'
  | 'out_for_delivery' | 'delivered' | 'delivery_failed'
  | 'return_requested' | 'returned'

export const ORDER_STATUS_FLOW: { status: ExtendedOrderStatus; label: string; actor: string }[] = [
  { status: 'pending_payment', label: 'Pending Payment', actor: 'Customer' },
  { status: 'payment_confirmed', label: 'Payment Confirmed', actor: 'Razorpay Webhook' },
  { status: 'order_received', label: 'Order Received', actor: 'Admin' },
  { status: 'processing', label: 'Processing', actor: 'Admin' },
  { status: 'packaging', label: 'Packaging', actor: 'Admin' },
  { status: 'ready_for_pickup', label: 'Ready for Pickup', actor: 'Admin' },
  { status: 'courier_assigned', label: 'Courier Assigned', actor: 'Admin' },
  { status: 'picked_up', label: 'Picked Up', actor: 'Courier' },
  { status: 'in_transit', label: 'In Transit', actor: 'Courier' },
  { status: 'out_for_delivery', label: 'Out for Delivery', actor: 'Courier' },
  { status: 'delivered', label: 'Delivered', actor: 'Courier' },
  { status: 'delivery_failed', label: 'Delivery Failed', actor: 'Courier' },
  { status: 'return_requested', label: 'Return Requested', actor: 'Customer' },
  { status: 'returned', label: 'Returned', actor: 'Admin' },
]

const EXTENDED_TRANSITIONS: Record<ExtendedOrderStatus, ExtendedOrderStatus[]> = {
  pending_payment: ['payment_confirmed'],
  payment_confirmed: ['order_received'],
  order_received: ['processing'],
  processing: ['packaging'],
  packaging: ['ready_for_pickup'],
  ready_for_pickup: ['courier_assigned'],
  courier_assigned: ['picked_up'],
  picked_up: ['in_transit'],
  in_transit: ['out_for_delivery', 'delivery_failed'],
  out_for_delivery: ['delivered', 'delivery_failed'],
  delivered: ['return_requested'],
  delivery_failed: ['courier_assigned', 'returned'], // Retry or return
  return_requested: ['returned'],
  returned: [], // Terminal
}

export function isValidExtendedTransition(from: ExtendedOrderStatus, to: ExtendedOrderStatus): boolean {
  if (from === to) return true
  return EXTENDED_TRANSITIONS[from]?.includes(to) ?? false
}

// ─── Pick List ───────────────────────────────────────────────────────────────

export interface PickListItem {
  orderItemId: string
  productId: string
  productName: string
  sku: string
  variantLabel: string // e.g., "Red / XL"
  quantity: number
  binLocation?: string
  barcode?: string
}

export interface PickList {
  orderId: string
  orderNumber: string
  createdAt: Date
  items: PickListItem[]
  totalItems: number
  totalQuantity: number
}

/**
 * Generate a pick list from order items.
 */
export function generatePickList(
  orderId: string,
  orderNumber: string,
  items: Array<{ id: string; productId: string; productName: string; sku: string; variantName: string; quantity: number; binLocation?: string; barcode?: string }>,
): PickList {
  const pickItems: PickListItem[] = items.map(item => ({
    orderItemId: item.id,
    productId: item.productId,
    productName: item.productName,
    sku: item.sku,
    variantLabel: item.variantName || 'Default',
    quantity: item.quantity,
    binLocation: item.binLocation,
    barcode: item.barcode,
  }))

  return {
    orderId,
    orderNumber,
    createdAt: new Date(),
    items: pickItems,
    totalItems: pickItems.length,
    totalQuantity: pickItems.reduce((sum, item) => sum + item.quantity, 0),
  }
}

// ─── Packing Slip ────────────────────────────────────────────────────────────

export interface PackingSlip {
  orderId: string
  orderNumber: string
  customerName: string
  deliveryAddress: string
  phone: string
  items: Array<{ productName: string; sku: string; variant: string; quantity: number }>
  totalItems: number
  generatedAt: Date
  notes?: string
}

/**
 * Generate a packing slip for an order.
 */
export function generatePackingSlip(
  orderId: string,
  orderNumber: string,
  customer: { name: string; address: string; phone: string },
  items: Array<{ productName: string; sku: string; variant: string; quantity: number }>,
  notes?: string,
): PackingSlip {
  return {
    orderId,
    orderNumber,
    customerName: customer.name,
    deliveryAddress: customer.address,
    phone: customer.phone,
    items,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    generatedAt: new Date(),
    notes,
  }
}

// ─── Barcode Scanning Verification ───────────────────────────────────────────

export interface ScanResult {
  matched: boolean
  scannedBarcode: string
  expectedBarcode?: string
  productId?: string
  error?: string
}

/**
 * Verify a scanned barcode against expected product.
 */
export function verifyBarcodeScan(scannedBarcode: string, expectedItems: Array<{ barcode: string; productId: string; sku: string }>): ScanResult {
  if (!scannedBarcode || scannedBarcode.trim() === '') {
    return { matched: false, scannedBarcode, error: 'Empty barcode scanned' }
  }

  const match = expectedItems.find(item => item.barcode === scannedBarcode || item.sku === scannedBarcode)

  if (match) {
    return { matched: true, scannedBarcode, expectedBarcode: match.barcode, productId: match.productId }
  }

  return { matched: false, scannedBarcode, error: `Barcode "${scannedBarcode}" does not match any item in this order` }
}

// ─── Out-of-Stock Handling ───────────────────────────────────────────────────

export interface StockCheckResult {
  allInStock: boolean
  outOfStockItems: Array<{ productId: string; productName: string; requested: number; available: number }>
}

/**
 * Check if all items in an order are in stock.
 */
export function checkOrderStock(
  items: Array<{ productId: string; productName: string; quantity: number; availableStock: number }>,
): StockCheckResult {
  const outOfStock = items.filter(item => item.availableStock < item.quantity)
  return {
    allInStock: outOfStock.length === 0,
    outOfStockItems: outOfStock.map(item => ({
      productId: item.productId,
      productName: item.productName,
      requested: item.quantity,
      available: item.availableStock,
    })),
  }
}

// ─── Shipping Label ──────────────────────────────────────────────────────────

export interface ShippingLabelData {
  orderId: string
  orderNumber: string
  trackingId: string
  customerName: string
  address: string
  city: string
  state: string
  pincode: string
  phone: string
  courierName: string
  weight?: number
  isCOD: boolean
  codAmount?: number
}

/**
 * Generate shipping label data.
 */
export function generateShippingLabelData(
  order: { id: string; orderNumber: string; total: number; paymentMethod: string },
  customer: { name: string; address: string; city: string; state: string; pincode: string; phone: string },
  courier: { name: string; trackingId: string },
  weight?: number,
): ShippingLabelData {
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    trackingId: courier.trackingId,
    customerName: customer.name,
    address: customer.address,
    city: customer.city,
    state: customer.state,
    pincode: customer.pincode,
    phone: customer.phone,
    courierName: courier.name,
    weight,
    isCOD: order.paymentMethod === 'cod',
    codAmount: order.paymentMethod === 'cod' ? order.total : undefined,
  }
}
