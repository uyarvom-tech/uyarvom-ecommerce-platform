/**
 * Marketing & Promotions — Core business logic
 * Handles coupons, discount rules, campaigns, affiliates, cross-sell, and abandoned cart.
 */

// ─── Coupon Types ────────────────────────────────────────────────────────────

export type CouponType = 'percentage' | 'fixed' | 'free_shipping' | 'bogo' | 'tiered'
export type CouponStatus = 'active' | 'expired' | 'exhausted' | 'disabled'

export interface Coupon {
  id: string
  code: string
  type: CouponType
  value: number // percentage or fixed amount
  minOrderAmount: number
  maxDiscount: number // cap for percentage coupons
  usageLimit: number // 0 = unlimited
  usedCount: number
  perUserLimit: number // 0 = unlimited
  startDate: Date
  endDate: Date
  isActive: boolean
  applicableCategories?: string[] // empty = all
  applicableProducts?: string[] // empty = all
  excludeDiscounted: boolean // don't apply on already-discounted items
}

// ─── Coupon Validation ───────────────────────────────────────────────────────

export interface CouponValidation {
  valid: boolean
  error?: string
  discount?: number
  couponType?: CouponType
}

/**
 * Validate a coupon code against cart context.
 */
export function validateCoupon(
  coupon: Coupon,
  cartTotal: number,
  userUsageCount: number = 0,
  now: Date = new Date(),
): CouponValidation {
  if (!coupon.isActive) {
    return { valid: false, error: 'This coupon is no longer active' }
  }

  if (now < new Date(coupon.startDate)) {
    return { valid: false, error: 'This coupon is not yet active' }
  }

  if (now > new Date(coupon.endDate)) {
    return { valid: false, error: 'This coupon has expired' }
  }

  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, error: 'This coupon has reached its usage limit' }
  }

  if (coupon.perUserLimit > 0 && userUsageCount >= coupon.perUserLimit) {
    return { valid: false, error: 'You have already used this coupon the maximum number of times' }
  }

  if (cartTotal < coupon.minOrderAmount) {
    return { valid: false, error: `Minimum order amount is ₹${coupon.minOrderAmount}` }
  }

  const discount = calculateCouponDiscount(coupon, cartTotal)
  return { valid: true, discount, couponType: coupon.type }
}

// ─── Discount Calculation ────────────────────────────────────────────────────

/**
 * Calculate the discount amount for a coupon.
 */
export function calculateCouponDiscount(coupon: Coupon, cartTotal: number): number {
  switch (coupon.type) {
    case 'percentage': {
      const discount = Math.round(cartTotal * (coupon.value / 100))
      return coupon.maxDiscount > 0 ? Math.min(discount, coupon.maxDiscount) : discount
    }
    case 'fixed':
      return Math.min(coupon.value, cartTotal) // Can't discount more than cart total
    case 'free_shipping':
      return 0 // Shipping handled separately
    case 'bogo':
      return 0 // BOGO handled at item level
    case 'tiered':
      return coupon.value // Tiered coupons have pre-calculated value
    default:
      return 0
  }
}

// ─── Discount Stacking Rules ─────────────────────────────────────────────────

export interface DiscountRule {
  id: string
  name: string
  type: 'percentage' | 'fixed' | 'bogo' | 'bundle'
  value: number
  conditions: {
    minQuantity?: number
    minAmount?: number
    categories?: string[]
    products?: string[]
  }
  priority: number // Higher priority applied first
  stackable: boolean // Can combine with other discounts
}

/**
 * Apply multiple discount rules to a cart, respecting stacking rules.
 */
export function applyDiscountRules(
  cartTotal: number,
  rules: DiscountRule[],
): { totalDiscount: number; appliedRules: string[] } {
  // Sort by priority (highest first)
  const sorted = [...rules].sort((a, b) => b.priority - a.priority)

  let totalDiscount = 0
  const appliedRules: string[] = []
  let hasNonStackable = false

  for (const rule of sorted) {
    if (hasNonStackable) break // Stop after non-stackable rule

    let ruleDiscount = 0
    switch (rule.type) {
      case 'percentage':
        ruleDiscount = Math.round((cartTotal - totalDiscount) * (rule.value / 100))
        break
      case 'fixed':
        ruleDiscount = Math.min(rule.value, cartTotal - totalDiscount)
        break
      case 'bundle':
        ruleDiscount = rule.value
        break
    }

    if (ruleDiscount > 0) {
      totalDiscount += ruleDiscount
      appliedRules.push(rule.id)
      if (!rule.stackable) hasNonStackable = true
    }
  }

  // Never discount more than cart total
  return { totalDiscount: Math.min(totalDiscount, cartTotal), appliedRules }
}

// ─── Campaign Management ─────────────────────────────────────────────────────

export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled'
export type CampaignType = 'flash_sale' | 'seasonal' | 'clearance' | 'loyalty_exclusive' | 'new_launch' | 'festival'

export interface Campaign {
  id: string
  name: string
  type: CampaignType
  status: CampaignStatus
  startDate: Date
  endDate: Date
  targetSegments?: string[]
  discountRuleIds?: string[]
  couponCodes?: string[]
}

/**
 * Determine campaign status based on dates.
 */
export function getCampaignStatus(startDate: Date, endDate: Date, now: Date = new Date()): CampaignStatus {
  if (now < new Date(startDate)) return 'scheduled'
  if (now > new Date(endDate)) return 'completed'
  return 'active'
}

// ─── Affiliate Program ───────────────────────────────────────────────────────

export interface AffiliateConfig {
  commissionRate: number // percentage
  cookieDays: number // tracking cookie duration
  minPayout: number // minimum amount before payout
  payoutSchedule: 'monthly' | 'weekly'
}

export const DEFAULT_AFFILIATE_CONFIG: AffiliateConfig = {
  commissionRate: 5,
  cookieDays: 30,
  minPayout: 500,
  payoutSchedule: 'monthly',
}

/**
 * Calculate affiliate commission for an order.
 */
export function calculateCommission(orderTotal: number, commissionRate: number = 5): number {
  return Math.round(orderTotal * (commissionRate / 100))
}

/**
 * Generate an affiliate tracking link.
 */
export function generateAffiliateLink(baseUrl: string, affiliateCode: string, productSlug?: string): string {
  const path = productSlug ? `/products/${productSlug}` : '/'
  return `${baseUrl}${path}?ref=${affiliateCode}`
}

// ─── Cross-sell & Upsell ─────────────────────────────────────────────────────

export type RecommendationType = 'cross_sell' | 'upsell' | 'frequently_bought_together' | 'similar'

export interface ProductRecommendation {
  productId: string
  type: RecommendationType
  score: number // relevance score 0-100
  reason: string
}

/**
 * Simple rule-based recommendation scorer.
 */
export function scoreRecommendation(
  sourcePrice: number,
  targetPrice: number,
  sameCategory: boolean,
  type: RecommendationType,
): number {
  let score = 50 // Base score

  if (sameCategory) score += 20
  if (type === 'upsell' && targetPrice > sourcePrice) score += 15
  if (type === 'cross_sell' && targetPrice < sourcePrice * 0.5) score += 10
  if (type === 'frequently_bought_together') score += 25

  return Math.min(100, score)
}

// ─── Abandoned Cart ──────────────────────────────────────────────────────────

export interface AbandonedCartTrigger {
  hoursAfterAbandonment: number
  emailTemplate: string
  includeDiscount: boolean
  discountCode?: string
}

export const ABANDONED_CART_SEQUENCE: AbandonedCartTrigger[] = [
  { hoursAfterAbandonment: 1, emailTemplate: 'reminder_1', includeDiscount: false },
  { hoursAfterAbandonment: 24, emailTemplate: 'reminder_2', includeDiscount: true, discountCode: 'COMEBACK10' },
  { hoursAfterAbandonment: 72, emailTemplate: 'final_reminder', includeDiscount: true, discountCode: 'LASTCHANCE15' },
]

/**
 * Check if a cart is abandoned (items in cart but no checkout activity).
 */
export function isCartAbandoned(lastActivityAt: Date, thresholdHours: number = 1): boolean {
  const hoursSince = (Date.now() - new Date(lastActivityAt).getTime()) / (1000 * 60 * 60)
  return hoursSince >= thresholdHours
}
