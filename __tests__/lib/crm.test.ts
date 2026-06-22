import { describe, it, expect } from 'vitest'
import {
  calculatePointsEarned,
  pointsToDiscount,
  discountToPoints,
  getTierFromPoints,
  getNextTierInfo,
  calculateRFMScores,
  getSegmentFromRFM,
  calculateCLV,
  LOYALTY_TIERS,
  SEGMENT_LABELS,
  NOTE_TYPES,
} from '@/lib/crm'

describe('CRM Business Logic', () => {
  describe('Loyalty Points', () => {
    it('calculates points earned for bronze tier (1x)', () => {
      // ₹1000 order, bronze = 100 base points * 1 = 100
      expect(calculatePointsEarned(1000, 'bronze')).toBe(100)
    })

    it('calculates points earned for silver tier (1.25x)', () => {
      // ₹1000 order, silver = 100 base * 1.25 = 125
      expect(calculatePointsEarned(1000, 'silver')).toBe(125)
    })

    it('calculates points earned for gold tier (1.5x)', () => {
      expect(calculatePointsEarned(1000, 'gold')).toBe(150)
    })

    it('calculates points earned for platinum tier (2x)', () => {
      expect(calculatePointsEarned(1000, 'platinum')).toBe(200)
    })

    it('floors fractional points', () => {
      // ₹55 = 5 base points
      expect(calculatePointsEarned(55, 'bronze')).toBe(5)
    })

    it('returns 0 for very small orders', () => {
      expect(calculatePointsEarned(5, 'bronze')).toBe(0)
    })
  })

  describe('Points to Discount', () => {
    it('converts points to discount (10 pts = ₹1)', () => {
      expect(pointsToDiscount(100)).toBe(10) // 100 pts = ₹10
      expect(pointsToDiscount(500)).toBe(50) // 500 pts = ₹50
    })

    it('floors fractional discounts', () => {
      expect(pointsToDiscount(15)).toBe(1) // 15 pts = ₹1
    })

    it('converts discount to points', () => {
      expect(discountToPoints(10)).toBe(100)
      expect(discountToPoints(50)).toBe(500)
    })
  })

  describe('Tier Determination', () => {
    it('returns bronze for 0-499 points', () => {
      expect(getTierFromPoints(0)).toBe('bronze')
      expect(getTierFromPoints(499)).toBe('bronze')
    })

    it('returns silver for 500-1999 points', () => {
      expect(getTierFromPoints(500)).toBe('silver')
      expect(getTierFromPoints(1999)).toBe('silver')
    })

    it('returns gold for 2000-4999 points', () => {
      expect(getTierFromPoints(2000)).toBe('gold')
      expect(getTierFromPoints(4999)).toBe('gold')
    })

    it('returns platinum for 5000+ points', () => {
      expect(getTierFromPoints(5000)).toBe('platinum')
      expect(getTierFromPoints(99999)).toBe('platinum')
    })
  })

  describe('Next Tier Info', () => {
    it('shows points needed for next tier', () => {
      const info = getNextTierInfo(300)
      expect(info.nextTier).toBe('silver')
      expect(info.pointsNeeded).toBe(200) // 500 - 300
    })

    it('returns null nextTier for platinum', () => {
      const info = getNextTierInfo(10000)
      expect(info.nextTier).toBeNull()
      expect(info.pointsNeeded).toBe(0)
    })
  })

  describe('RFM Segmentation', () => {
    it('calculates high RFM for recent frequent big spender', () => {
      const scores = calculateRFMScores(3, 15, 15000) // 3 days ago, 15 orders, ₹15000
      expect(scores.recency).toBe(5)
      expect(scores.frequency).toBe(5)
      expect(scores.monetary).toBe(5)
    })

    it('calculates low RFM for old infrequent low spender', () => {
      const scores = calculateRFMScores(200, 1, 500) // 200 days, 1 order, ₹500
      expect(scores.recency).toBe(1)
      expect(scores.frequency).toBe(1)
      expect(scores.monetary).toBe(1)
    })

    it('segments champions correctly', () => {
      const scores = { recency: 5, frequency: 5, monetary: 5 }
      expect(getSegmentFromRFM(scores)).toBe('champions')
    })

    it('segments loyal correctly', () => {
      const scores = { recency: 3, frequency: 5, monetary: 4 }
      expect(getSegmentFromRFM(scores)).toBe('loyal')
    })

    it('segments new customers correctly', () => {
      const scores = { recency: 5, frequency: 1, monetary: 2 }
      expect(getSegmentFromRFM(scores)).toBe('new')
    })

    it('segments at-risk correctly', () => {
      const scores = { recency: 1, frequency: 3, monetary: 2 }
      expect(getSegmentFromRFM(scores)).toBe('at_risk')
    })

    it('segments lost correctly', () => {
      const scores = { recency: 1, frequency: 1, monetary: 1 }
      expect(getSegmentFromRFM(scores)).toBe('lost')
    })
  })

  describe('Customer Lifetime Value', () => {
    it('calculates CLV correctly', () => {
      const firstOrder = new Date()
      firstOrder.setMonth(firstOrder.getMonth() - 6) // 6 months ago
      const clv = calculateCLV(6000, 6, firstOrder, 24)
      expect(clv.avgOrderValue).toBe(1000) // 6000/6
      expect(clv.totalOrders).toBe(6)
      expect(clv.purchaseFrequency).toBeGreaterThanOrEqual(0.9)
      expect(clv.purchaseFrequency).toBeLessThanOrEqual(1.1)
      expect(clv.estimatedCLV).toBeGreaterThan(20000)
    })

    it('handles zero orders', () => {
      const clv = calculateCLV(0, 0, new Date())
      expect(clv.avgOrderValue).toBe(0)
      expect(clv.estimatedCLV).toBe(0)
    })
  })

  describe('Constants', () => {
    it('LOYALTY_TIERS has 4 tiers', () => {
      expect(LOYALTY_TIERS).toHaveLength(4)
    })

    it('SEGMENT_LABELS has all RFM segments', () => {
      expect(Object.keys(SEGMENT_LABELS)).toContain('champions')
      expect(Object.keys(SEGMENT_LABELS)).toContain('lost')
      expect(Object.keys(SEGMENT_LABELS)).toContain('at_risk')
    })

    it('NOTE_TYPES has all types', () => {
      const values = NOTE_TYPES.map((n) => n.value)
      expect(values).toContain('general')
      expect(values).toContain('support')
      expect(values).toContain('internal')
    })
  })
})
