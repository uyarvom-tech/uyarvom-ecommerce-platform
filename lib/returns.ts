/**
 * Returns & Refund Management — Core business logic
 * Handles return workflows, refund calculations, replacements, and analytics.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type ReturnStatus = 'requested' | 'approved' | 'rejected' | 'pickup_scheduled' | 'picked_up' | 'received' | 'inspected' | 'refunded' | 'replaced' | 'closed'
export type RefundMethod = 'original_payment' | 'store_credit' | 'bank_transfer'
export type ReturnReason = 'wrong_item' | 'defective' | 'not_as_described' | 'wrong_size' | 'changed_mind' | 'damaged_in_transit' | 'other'
export type InspectionResult = 'accepted' | 'rejected' | 'partial'

export const RETURN_REASONS: { value: ReturnReason; label: string; refundEligible: boolean }[] = [
  { value: 'wrong_item', label: 'Wrong Item Received', refundEligible: true },
  { value: 'defective', label: 'Defective / Not Working', refundEligible: true },
  { value: 'not_as_described', label: 'Not As Described', refundEligible: true },
  { value: 'wrong_size', label: 'Wrong Size / Fit', refundEligible: true },
  { value: 'changed_mind', label: 'Changed My Mind', refundEligible: true },
  { value: 'damaged_in_transit', label: 'Damaged in Transit', refundEligible: true },
  { value: 'other', label: 'Other Reason', refundEligible: false },
]

// ─── Return State Machine ────────────────────────────────────────────────────

const RETURN_TRANSITIONS: Record<ReturnStatus, ReturnStatus[]> = {
  requested: ['approved', 'rejected'],
  approved: ['pickup_scheduled', 'received'],
  rejected: ['closed'],
  pickup_scheduled: ['picked_up'],
  picked_up: ['received'],
  received: ['inspected'],
  inspected: ['refunded', 'replaced', 'rejected'],
  refunded: ['closed'],
  replaced: ['closed'],
  closed: [],
}

export function isValidReturnTransition(from: ReturnStatus, to: ReturnStatus): boolean {
  if (from === to) return true
  return RETURN_TRANSITIONS[from]?.includes(to) ?? false
}

export function getNextReturnStatuses(current: ReturnStatus): ReturnStatus[] {
  return RETURN_TRANSITIONS[current] || []
}

// ─── Refund Calculations ─────────────────────────────────────────────────────

export interface RefundCalculation {
  itemTotal: number
  shippingRefund: number
  taxRefund: number
  deductions: number
  netRefund: number
  refundMethod: RefundMethod
  storeCredit: number
}

/**
 * Calculate refund amount for a return.
 * Rules:
 * - Full item price refund for eligible reasons
 * - Shipping refunded only for seller-fault reasons (wrong_item, defective, damaged)
 * - Tax refund proportional to item value
 * - Restocking fee (5%) for "changed_mind" returns
 */
export function calculateRefund(
  itemTotal: number,
  shippingPaid: number,
  taxPaid: number,
  orderTotal: number,
  reason: ReturnReason,
  refundMethod: RefundMethod = 'original_payment',
): RefundCalculation {
  const sellerFault = ['wrong_item', 'defective', 'not_as_described', 'damaged_in_transit'].includes(reason)
  const restockingFee = reason === 'changed_mind' ? Math.round(itemTotal * 0.05) : 0
  
  // Shipping refund only for seller-fault
  const shippingRefund = sellerFault ? shippingPaid : 0
  
  // Tax refund proportional
  const taxRefund = orderTotal > 0 ? Math.round((itemTotal / orderTotal) * taxPaid) : 0
  
  const netRefund = itemTotal + shippingRefund + taxRefund - restockingFee
  
  // Store credit bonus (10% extra if choosing store credit)
  const storeCredit = refundMethod === 'store_credit' ? Math.round(netRefund * 1.1) : 0

  return {
    itemTotal,
    shippingRefund,
    taxRefund,
    deductions: restockingFee,
    netRefund: Math.max(0, netRefund),
    refundMethod,
    storeCredit,
  }
}

// ─── Return Eligibility ──────────────────────────────────────────────────────

export interface ReturnEligibility {
  eligible: boolean
  reason?: string
  daysRemaining?: number
  windowDays: number
}

/**
 * Check if an order/item is eligible for return.
 */
export function checkReturnEligibility(
  orderStatus: string,
  deliveredAt: Date | null,
  windowDays: number = 7,
  alreadyReturned: boolean = false,
): ReturnEligibility {
  if (alreadyReturned) {
    return { eligible: false, reason: 'A return has already been requested for this order', windowDays }
  }

  if (orderStatus !== 'delivered') {
    return { eligible: false, reason: 'Only delivered orders can be returned', windowDays }
  }

  if (!deliveredAt) {
    return { eligible: false, reason: 'Delivery date not recorded', windowDays }
  }

  const daysSince = (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24)
  const daysRemaining = Math.max(0, Math.ceil(windowDays - daysSince))

  if (daysSince > windowDays) {
    return { eligible: false, reason: `Return window (${windowDays} days) has expired`, windowDays, daysRemaining: 0 }
  }

  return { eligible: true, daysRemaining, windowDays }
}

// ─── Return Analytics ────────────────────────────────────────────────────────

export interface ReturnAnalytics {
  totalReturns: number
  returnRate: number // percentage of orders returned
  approvalRate: number
  avgProcessingDays: number
  totalRefunded: number
  reasonBreakdown: Record<string, number>
  topReturnedProducts: Array<{ productId: string; productName: string; count: number }>
}

/**
 * Calculate return rate.
 */
export function calculateReturnRate(totalReturns: number, totalOrders: number): number {
  if (totalOrders === 0) return 0
  return Math.round((totalReturns / totalOrders) * 100 * 10) / 10
}

/**
 * Calculate average processing time in days.
 */
export function calculateAvgProcessingDays(
  returns: Array<{ requestedAt: Date; resolvedAt: Date | null }>
): number {
  const resolved = returns.filter((r) => r.resolvedAt)
  if (resolved.length === 0) return 0
  
  const totalDays = resolved.reduce((sum, r) => {
    const days = (new Date(r.resolvedAt!).getTime() - new Date(r.requestedAt).getTime()) / (1000 * 60 * 60 * 24)
    return sum + days
  }, 0)

  return Math.round((totalDays / resolved.length) * 10) / 10
}

// ─── Replacement Order ───────────────────────────────────────────────────────

export interface ReplacementOrder {
  originalOrderId: string
  originalItemId: string
  replacementVariantId: string
  reason: ReturnReason
  notes?: string
}

/**
 * Validate replacement eligibility.
 */
export function canReplace(reason: ReturnReason, variantStock: number): { eligible: boolean; reason?: string } {
  if (!['wrong_item', 'defective', 'wrong_size', 'damaged_in_transit'].includes(reason)) {
    return { eligible: false, reason: 'Replacement only available for wrong item, defective, wrong size, or damaged' }
  }
  if (variantStock <= 0) {
    return { eligible: false, reason: 'Replacement variant is out of stock' }
  }
  return { eligible: true }
}
