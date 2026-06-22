/**
 * Customer Relationship Management — Core business logic
 * Handles loyalty points, customer segmentation, lifetime value, and notes.
 */

// ─── Loyalty Program ─────────────────────────────────────────────────────────

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export const LOYALTY_TIERS: { tier: LoyaltyTier; minPoints: number; multiplier: number; label: string }[] = [
  { tier: 'bronze', minPoints: 0, multiplier: 1, label: 'Bronze' },
  { tier: 'silver', minPoints: 500, multiplier: 1.25, label: 'Silver' },
  { tier: 'gold', minPoints: 2000, multiplier: 1.5, label: 'Gold' },
  { tier: 'platinum', minPoints: 5000, multiplier: 2, label: 'Platinum' },
]

/**
 * Calculate loyalty points earned from an order.
 * Base: 1 point per ₹10 spent, multiplied by tier.
 */
export function calculatePointsEarned(orderTotal: number, tier: LoyaltyTier): number {
  const tierConfig = LOYALTY_TIERS.find((t) => t.tier === tier) || LOYALTY_TIERS[0]
  const basePoints = Math.floor(orderTotal / 10)
  return Math.floor(basePoints * tierConfig.multiplier)
}

/**
 * Calculate points required for a redemption amount.
 * 100 points = ₹10 discount
 */
export function pointsToDiscount(points: number): number {
  return Math.floor(points / 10) // 10 points = ₹1
}

export function discountToPoints(discountAmount: number): number {
  return discountAmount * 10
}

/**
 * Determine loyalty tier from total lifetime points.
 */
export function getTierFromPoints(lifetimePoints: number): LoyaltyTier {
  for (let i = LOYALTY_TIERS.length - 1; i >= 0; i--) {
    if (lifetimePoints >= LOYALTY_TIERS[i].minPoints) {
      return LOYALTY_TIERS[i].tier
    }
  }
  return 'bronze'
}

/**
 * Get next tier and points needed to reach it.
 */
export function getNextTierInfo(lifetimePoints: number): { nextTier: LoyaltyTier | null; pointsNeeded: number } {
  const currentTier = getTierFromPoints(lifetimePoints)
  const currentIndex = LOYALTY_TIERS.findIndex((t) => t.tier === currentTier)
  
  if (currentIndex >= LOYALTY_TIERS.length - 1) {
    return { nextTier: null, pointsNeeded: 0 } // Already at max tier
  }

  const next = LOYALTY_TIERS[currentIndex + 1]
  return { nextTier: next.tier, pointsNeeded: next.minPoints - lifetimePoints }
}

// ─── Customer Segmentation (RFM) ────────────────────────────────────────────

export type RFMSegment = 'champions' | 'loyal' | 'potential' | 'new' | 'at_risk' | 'dormant' | 'lost'

export interface RFMScores {
  recency: number // 1-5 (5 = most recent)
  frequency: number // 1-5 (5 = most frequent)
  monetary: number // 1-5 (5 = highest spend)
}

/**
 * Calculate RFM scores for a customer.
 */
export function calculateRFMScores(
  daysSinceLastOrder: number,
  totalOrders: number,
  totalSpent: number,
  avgDaysSinceOrder: number = 30,
  avgOrders: number = 3,
  avgSpent: number = 3000,
): RFMScores {
  // Recency: lower days = better score
  const recency = daysSinceLastOrder <= 7 ? 5 :
    daysSinceLastOrder <= 30 ? 4 :
    daysSinceLastOrder <= 90 ? 3 :
    daysSinceLastOrder <= 180 ? 2 : 1

  // Frequency: more orders = better score
  const frequency = totalOrders >= avgOrders * 3 ? 5 :
    totalOrders >= avgOrders * 2 ? 4 :
    totalOrders >= avgOrders ? 3 :
    totalOrders >= 2 ? 2 : 1

  // Monetary: higher spend = better score
  const monetary = totalSpent >= avgSpent * 3 ? 5 :
    totalSpent >= avgSpent * 2 ? 4 :
    totalSpent >= avgSpent ? 3 :
    totalSpent >= avgSpent * 0.5 ? 2 : 1

  return { recency, frequency, monetary }
}

/**
 * Determine customer segment from RFM scores.
 */
export function getSegmentFromRFM(scores: RFMScores): RFMSegment {
  const { recency, frequency, monetary } = scores
  const total = recency + frequency + monetary

  if (recency >= 4 && frequency >= 4 && monetary >= 4) return 'champions'
  if (frequency >= 4 && monetary >= 3) return 'loyal'
  if (recency >= 4 && frequency <= 2) return 'new'
  if (recency >= 3 && total >= 9) return 'potential'
  if (recency <= 2 && frequency >= 3) return 'at_risk'
  if (recency <= 2 && frequency <= 2 && total <= 6) return 'lost'
  return 'dormant'
}

export const SEGMENT_LABELS: Record<RFMSegment, { label: string; description: string; color: string }> = {
  champions: { label: 'Champions', description: 'Best customers — buy often, spend big, recent', color: '#10b981' },
  loyal: { label: 'Loyal', description: 'Frequent buyers with good spend', color: '#3b82f6' },
  potential: { label: 'Potential Loyalists', description: 'Recent with good engagement', color: '#8b5cf6' },
  new: { label: 'New Customers', description: 'Just started buying', color: '#06b6d4' },
  at_risk: { label: 'At Risk', description: 'Used to buy often but not recently', color: '#f59e0b' },
  dormant: { label: 'Dormant', description: 'Low engagement across all dimensions', color: '#6b7280' },
  lost: { label: 'Lost', description: 'Haven\'t bought in a long time, low spend', color: '#ef4444' },
}

// ─── Customer Lifetime Value ─────────────────────────────────────────────────

export interface CLVData {
  totalRevenue: number
  totalOrders: number
  firstOrderDate: Date
  lastOrderDate: Date
  avgOrderValue: number
  purchaseFrequency: number // orders per month
  estimatedCLV: number
}

/**
 * Calculate Customer Lifetime Value (simple model).
 * CLV = Average Order Value × Purchase Frequency × Expected Lifespan (months)
 */
export function calculateCLV(
  totalRevenue: number,
  totalOrders: number,
  firstOrderDate: Date,
  expectedLifespanMonths: number = 24,
): CLVData {
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const monthsSinceFirst = Math.max(1, (Date.now() - new Date(firstOrderDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
  const purchaseFrequency = totalOrders / monthsSinceFirst
  const estimatedCLV = avgOrderValue * purchaseFrequency * expectedLifespanMonths

  return {
    totalRevenue,
    totalOrders,
    firstOrderDate,
    lastOrderDate: new Date(), // Will be overridden by actual data
    avgOrderValue: Math.round(avgOrderValue),
    purchaseFrequency: Math.round(purchaseFrequency * 100) / 100,
    estimatedCLV: Math.round(estimatedCLV),
  }
}

// ─── Customer Notes ──────────────────────────────────────────────────────────

export type NoteType = 'general' | 'support' | 'order' | 'feedback' | 'internal'

export const NOTE_TYPES: { value: NoteType; label: string }[] = [
  { value: 'general', label: 'General Note' },
  { value: 'support', label: 'Support Interaction' },
  { value: 'order', label: 'Order Related' },
  { value: 'feedback', label: 'Customer Feedback' },
  { value: 'internal', label: 'Internal Only' },
]
