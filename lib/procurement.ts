/**
 * Procurement & Vendor Management — Core business logic
 * Handles vendor management, purchase orders, goods receipts, and auto-reorder.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type POStatus = 'draft' | 'pending_approval' | 'approved' | 'sent' | 'partially_received' | 'received' | 'invoiced' | 'cancelled'

export type GoodsReceiptStatus = 'pending_inspection' | 'approved' | 'rejected' | 'partial'

export const PO_STATUSES: { value: POStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'sent', label: 'Sent to Vendor' },
  { value: 'partially_received', label: 'Partially Received' },
  { value: 'received', label: 'Fully Received' },
  { value: 'invoiced', label: 'Invoiced' },
  { value: 'cancelled', label: 'Cancelled' },
]

// ─── PO State Machine ────────────────────────────────────────────────────────

const PO_TRANSITIONS: Record<POStatus, POStatus[]> = {
  draft: ['pending_approval', 'approved', 'cancelled'],
  pending_approval: ['approved', 'cancelled'],
  approved: ['sent', 'cancelled'],
  sent: ['partially_received', 'received', 'cancelled'],
  partially_received: ['received', 'cancelled'],
  received: ['invoiced'],
  invoiced: [], // Terminal
  cancelled: [], // Terminal
}

export function isValidPOTransition(from: POStatus, to: POStatus): boolean {
  if (from === to) return true
  return PO_TRANSITIONS[from]?.includes(to) ?? false
}

export function getNextPOStatuses(current: POStatus): POStatus[] {
  return PO_TRANSITIONS[current] || []
}

// ─── PO Calculations ─────────────────────────────────────────────────────────

export interface POLineItem {
  variantId: string
  quantity: number
  unitPrice: number
  discount?: number // percentage
  tax?: number // percentage
}

export interface POTotals {
  subtotal: number
  totalDiscount: number
  totalTax: number
  grandTotal: number
  lineCount: number
  totalQuantity: number
}

/**
 * Calculate purchase order totals from line items.
 */
export function calculatePOTotals(items: POLineItem[]): POTotals {
  let subtotal = 0
  let totalDiscount = 0
  let totalTax = 0
  let totalQuantity = 0

  for (const item of items) {
    const lineSubtotal = item.quantity * item.unitPrice
    const lineDiscount = lineSubtotal * ((item.discount || 0) / 100)
    const lineAfterDiscount = lineSubtotal - lineDiscount
    const lineTax = lineAfterDiscount * ((item.tax || 0) / 100)

    subtotal += lineSubtotal
    totalDiscount += lineDiscount
    totalTax += lineTax
    totalQuantity += item.quantity
  }

  return {
    subtotal,
    totalDiscount,
    totalTax,
    grandTotal: subtotal - totalDiscount + totalTax,
    lineCount: items.length,
    totalQuantity,
  }
}

// ─── Vendor Performance ──────────────────────────────────────────────────────

export interface VendorPerformanceMetrics {
  totalOrders: number
  onTimeDeliveryRate: number // percentage
  qualityAcceptanceRate: number // percentage
  averageLeadTimeDays: number
  totalSpent: number
  rating: 'excellent' | 'good' | 'average' | 'poor'
}

/**
 * Calculate vendor performance rating based on metrics.
 */
export function calculateVendorRating(
  onTimeRate: number,
  qualityRate: number
): VendorPerformanceMetrics['rating'] {
  const score = (onTimeRate + qualityRate) / 2
  if (score >= 90) return 'excellent'
  if (score >= 75) return 'good'
  if (score >= 60) return 'average'
  return 'poor'
}

// ─── Auto-Reorder ────────────────────────────────────────────────────────────

export interface ReorderSuggestion {
  variantId: string
  productName: string
  currentStock: number
  reorderPoint: number
  suggestedQuantity: number
  preferredVendorId?: string
  preferredVendorName?: string
  estimatedCost: number
}

/**
 * Check if a variant needs reordering based on safety stock levels.
 */
export function needsReorder(
  currentStock: number,
  safetyStock: number,
  pendingPOQuantity: number = 0
): boolean {
  return (currentStock + pendingPOQuantity) <= safetyStock
}

/**
 * Calculate suggested reorder quantity.
 * Uses Economic Order Quantity (EOQ) approximation.
 */
export function calculateReorderQuantity(
  avgDailySales: number,
  leadTimeDays: number,
  moq: number = 1,
  bufferDays: number = 30
): number {
  const targetStock = avgDailySales * (leadTimeDays + bufferDays)
  const quantity = Math.max(targetStock, moq)
  // Round up to MOQ multiples
  return Math.ceil(quantity / moq) * moq
}

// ─── PO Number Generation ────────────────────────────────────────────────────

export function generatePONumber(): string {
  const date = new Date()
  const yr = date.getFullYear().toString().slice(-2)
  const mo = (date.getMonth() + 1).toString().padStart(2, '0')
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `PO-${yr}${mo}-${random}`
}

// ─── Goods Receipt Validation ────────────────────────────────────────────────

export interface GoodsReceiptItem {
  poLineId: string
  orderedQty: number
  receivedQty: number
  acceptedQty: number
  rejectedQty: number
  rejectionReason?: string
}

/**
 * Validate a goods receipt against PO line items.
 */
export function validateGoodsReceipt(items: GoodsReceiptItem[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  for (const item of items) {
    if (item.receivedQty < 0) {
      errors.push(`Received quantity cannot be negative (line ${item.poLineId})`)
    }
    if (item.acceptedQty + item.rejectedQty !== item.receivedQty) {
      errors.push(`Accepted + Rejected must equal Received for line ${item.poLineId}`)
    }
    if (item.receivedQty > item.orderedQty) {
      errors.push(`Received quantity (${item.receivedQty}) exceeds ordered (${item.orderedQty}) for line ${item.poLineId}`)
    }
    if (item.rejectedQty > 0 && !item.rejectionReason) {
      errors.push(`Rejection reason required for line ${item.poLineId}`)
    }
  }

  return { valid: errors.length === 0, errors }
}
