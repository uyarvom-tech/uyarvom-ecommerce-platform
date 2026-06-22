import { describe, it, expect } from 'vitest'
import {
  validateCoupon,
  calculateCouponDiscount,
  applyDiscountRules,
  getCampaignStatus,
  calculateCommission,
  generateAffiliateLink,
  scoreRecommendation,
  isCartAbandoned,
  ABANDONED_CART_SEQUENCE,
  DEFAULT_AFFILIATE_CONFIG,
} from '@/lib/promotions'

describe('Marketing & Promotions', () => {
  const baseCoupon = {
    id: 'c1', code: 'SAVE20', type: 'percentage' as const, value: 20,
    minOrderAmount: 500, maxDiscount: 200, usageLimit: 100, usedCount: 5,
    perUserLimit: 2, startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'),
    isActive: true, excludeDiscounted: false,
  }

  describe('Coupon Validation', () => {
    it('validates an active coupon', () => {
      const result = validateCoupon(baseCoupon, 1000, 0, new Date('2026-06-15'))
      expect(result.valid).toBe(true)
      expect(result.discount).toBe(200) // 20% of 1000, capped at 200
    })

    it('rejects inactive coupon', () => {
      const result = validateCoupon({ ...baseCoupon, isActive: false }, 1000)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('no longer active')
    })

    it('rejects expired coupon', () => {
      const result = validateCoupon(baseCoupon, 1000, 0, new Date('2027-01-01'))
      expect(result.valid).toBe(false)
      expect(result.error).toContain('expired')
    })

    it('rejects coupon not yet active', () => {
      const result = validateCoupon(baseCoupon, 1000, 0, new Date('2025-12-01'))
      expect(result.valid).toBe(false)
      expect(result.error).toContain('not yet active')
    })

    it('rejects when usage limit reached', () => {
      const result = validateCoupon({ ...baseCoupon, usedCount: 100 }, 1000, 0, new Date('2026-06-15'))
      expect(result.valid).toBe(false)
      expect(result.error).toContain('usage limit')
    })

    it('rejects when per-user limit reached', () => {
      const result = validateCoupon(baseCoupon, 1000, 2, new Date('2026-06-15'))
      expect(result.valid).toBe(false)
      expect(result.error).toContain('maximum number')
    })

    it('rejects below minimum order amount', () => {
      const result = validateCoupon(baseCoupon, 300, 0, new Date('2026-06-15'))
      expect(result.valid).toBe(false)
      expect(result.error).toContain('₹500')
    })
  })

  describe('Discount Calculation', () => {
    it('percentage discount with cap', () => {
      expect(calculateCouponDiscount(baseCoupon, 2000)).toBe(200) // 20% = 400, capped at 200
    })

    it('percentage discount below cap', () => {
      expect(calculateCouponDiscount(baseCoupon, 500)).toBe(100) // 20% of 500 = 100
    })

    it('fixed discount cannot exceed cart total', () => {
      const fixedCoupon = { ...baseCoupon, type: 'fixed' as const, value: 500 }
      expect(calculateCouponDiscount(fixedCoupon, 300)).toBe(300) // Capped at cart total
    })

    it('fixed discount full amount', () => {
      const fixedCoupon = { ...baseCoupon, type: 'fixed' as const, value: 100 }
      expect(calculateCouponDiscount(fixedCoupon, 1000)).toBe(100)
    })

    it('free_shipping returns 0 (handled separately)', () => {
      const fsCoupon = { ...baseCoupon, type: 'free_shipping' as const }
      expect(calculateCouponDiscount(fsCoupon, 1000)).toBe(0)
    })
  })

  describe('Discount Rule Stacking', () => {
    it('applies multiple stackable rules', () => {
      const rules = [
        { id: 'r1', name: 'Sale', type: 'percentage' as const, value: 10, conditions: {}, priority: 1, stackable: true },
        { id: 'r2', name: 'Extra', type: 'fixed' as const, value: 50, conditions: {}, priority: 2, stackable: true },
      ]
      const result = applyDiscountRules(1000, rules)
      // r2 (priority 2) first: fixed 50, then r1: 10% of (1000-50) = 95
      expect(result.totalDiscount).toBe(145)
      expect(result.appliedRules).toHaveLength(2)
    })

    it('stops after non-stackable rule', () => {
      const rules = [
        { id: 'r1', name: 'Big', type: 'percentage' as const, value: 30, conditions: {}, priority: 10, stackable: false },
        { id: 'r2', name: 'Small', type: 'fixed' as const, value: 50, conditions: {}, priority: 1, stackable: true },
      ]
      const result = applyDiscountRules(1000, rules)
      expect(result.appliedRules).toEqual(['r1']) // Only non-stackable applied
      expect(result.totalDiscount).toBe(300)
    })

    it('never exceeds cart total', () => {
      const rules = [
        { id: 'r1', name: 'Huge', type: 'fixed' as const, value: 5000, conditions: {}, priority: 1, stackable: true },
      ]
      const result = applyDiscountRules(1000, rules)
      expect(result.totalDiscount).toBe(1000)
    })
  })

  describe('Campaign Status', () => {
    it('returns scheduled for future campaigns', () => {
      const start = new Date('2027-01-01')
      const end = new Date('2027-01-31')
      expect(getCampaignStatus(start, end, new Date('2026-06-15'))).toBe('scheduled')
    })

    it('returns active for current campaigns', () => {
      const start = new Date('2026-01-01')
      const end = new Date('2026-12-31')
      expect(getCampaignStatus(start, end, new Date('2026-06-15'))).toBe('active')
    })

    it('returns completed for past campaigns', () => {
      const start = new Date('2025-01-01')
      const end = new Date('2025-12-31')
      expect(getCampaignStatus(start, end, new Date('2026-06-15'))).toBe('completed')
    })
  })

  describe('Affiliate Program', () => {
    it('calculates commission correctly', () => {
      expect(calculateCommission(2000, 5)).toBe(100) // 5% of 2000
      expect(calculateCommission(1500, 10)).toBe(150)
    })

    it('generates affiliate link with product', () => {
      const link = generateAffiliateLink('https://uyarvom.com', 'ABC123', 'ceramic-bowl')
      expect(link).toBe('https://uyarvom.com/products/ceramic-bowl?ref=ABC123')
    })

    it('generates affiliate link without product (homepage)', () => {
      const link = generateAffiliateLink('https://uyarvom.com', 'XYZ789')
      expect(link).toBe('https://uyarvom.com/?ref=XYZ789')
    })

    it('DEFAULT_AFFILIATE_CONFIG has sensible defaults', () => {
      expect(DEFAULT_AFFILIATE_CONFIG.commissionRate).toBe(5)
      expect(DEFAULT_AFFILIATE_CONFIG.cookieDays).toBe(30)
    })
  })

  describe('Cross-sell & Upsell', () => {
    it('scores higher for same category', () => {
      const s1 = scoreRecommendation(500, 600, true, 'upsell')
      const s2 = scoreRecommendation(500, 600, false, 'upsell')
      expect(s1).toBeGreaterThan(s2)
    })

    it('scores higher for upsell with higher price', () => {
      const s = scoreRecommendation(500, 800, false, 'upsell')
      expect(s).toBeGreaterThan(50) // Base score
    })

    it('caps score at 100', () => {
      const s = scoreRecommendation(100, 200, true, 'frequently_bought_together')
      expect(s).toBeLessThanOrEqual(100)
    })
  })

  describe('Abandoned Cart', () => {
    it('detects abandoned cart after threshold', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
      expect(isCartAbandoned(twoHoursAgo, 1)).toBe(true)
    })

    it('not abandoned if recently active', () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
      expect(isCartAbandoned(fiveMinAgo, 1)).toBe(false)
    })

    it('ABANDONED_CART_SEQUENCE has 3 triggers', () => {
      expect(ABANDONED_CART_SEQUENCE).toHaveLength(3)
      expect(ABANDONED_CART_SEQUENCE[0].hoursAfterAbandonment).toBe(1)
      expect(ABANDONED_CART_SEQUENCE[2].includeDiscount).toBe(true)
    })
  })
})
