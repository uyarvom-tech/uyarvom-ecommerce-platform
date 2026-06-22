import { describe, it, expect } from 'vitest'
import {
  isValidReturnTransition,
  getNextReturnStatuses,
  calculateRefund,
  checkReturnEligibility,
  calculateReturnRate,
  calculateAvgProcessingDays,
  canReplace,
  RETURN_REASONS,
} from '@/lib/returns'

describe('Returns & Refund Management', () => {
  describe('Return State Machine', () => {
    it('allows requested → approved', () => {
      expect(isValidReturnTransition('requested', 'approved')).toBe(true)
    })
    it('allows requested → rejected', () => {
      expect(isValidReturnTransition('requested', 'rejected')).toBe(true)
    })
    it('allows approved → pickup_scheduled', () => {
      expect(isValidReturnTransition('approved', 'pickup_scheduled')).toBe(true)
    })
    it('allows received → inspected', () => {
      expect(isValidReturnTransition('received', 'inspected')).toBe(true)
    })
    it('allows inspected → refunded', () => {
      expect(isValidReturnTransition('inspected', 'refunded')).toBe(true)
    })
    it('allows inspected → replaced', () => {
      expect(isValidReturnTransition('inspected', 'replaced')).toBe(true)
    })
    it('rejects closed → anything', () => {
      expect(isValidReturnTransition('closed', 'requested')).toBe(false)
    })
    it('rejects backward transitions', () => {
      expect(isValidReturnTransition('refunded', 'approved')).toBe(false)
    })
    it('allows same status', () => {
      expect(isValidReturnTransition('approved', 'approved')).toBe(true)
    })
  })

  describe('getNextReturnStatuses', () => {
    it('requested can go to approved or rejected', () => {
      const next = getNextReturnStatuses('requested')
      expect(next).toContain('approved')
      expect(next).toContain('rejected')
    })
    it('closed has no next states', () => {
      expect(getNextReturnStatuses('closed')).toHaveLength(0)
    })
  })

  describe('Refund Calculation', () => {
    it('calculates full refund for seller-fault (defective)', () => {
      const refund = calculateRefund(1000, 50, 180, 1230, 'defective')
      expect(refund.itemTotal).toBe(1000)
      expect(refund.shippingRefund).toBe(50) // seller fault → shipping refunded
      expect(refund.deductions).toBe(0)
      expect(refund.netRefund).toBeGreaterThan(1000)
    })

    it('charges restocking fee for changed_mind', () => {
      const refund = calculateRefund(1000, 50, 180, 1230, 'changed_mind')
      expect(refund.deductions).toBe(50) // 5% restocking
      expect(refund.shippingRefund).toBe(0) // not seller fault
      // Net = itemTotal + 0 (no shipping) + taxRefund - restocking
      // taxRefund = round(1000/1230 * 180) = 146
      // Net = 1000 + 0 + 146 - 50 = 1096
      expect(refund.netRefund).toBe(1096)
    })

    it('gives 10% bonus for store credit', () => {
      const refund = calculateRefund(1000, 0, 0, 1000, 'defective', 'store_credit')
      expect(refund.storeCredit).toBe(1100) // 1000 + 10%
    })

    it('no store credit bonus for other methods', () => {
      const refund = calculateRefund(1000, 0, 0, 1000, 'defective', 'original_payment')
      expect(refund.storeCredit).toBe(0)
    })

    it('handles zero order total gracefully', () => {
      const refund = calculateRefund(0, 0, 0, 0, 'defective')
      expect(refund.netRefund).toBe(0)
    })
  })

  describe('Return Eligibility', () => {
    it('eligible within 7-day window', () => {
      const delivered = new Date()
      delivered.setDate(delivered.getDate() - 3)
      const result = checkReturnEligibility('delivered', delivered)
      expect(result.eligible).toBe(true)
      expect(result.daysRemaining).toBeGreaterThan(0)
    })

    it('ineligible after window expires', () => {
      const delivered = new Date()
      delivered.setDate(delivered.getDate() - 10)
      const result = checkReturnEligibility('delivered', delivered)
      expect(result.eligible).toBe(false)
      expect(result.reason).toContain('expired')
    })

    it('ineligible for non-delivered orders', () => {
      const result = checkReturnEligibility('shipped', new Date())
      expect(result.eligible).toBe(false)
    })

    it('ineligible if already returned', () => {
      const result = checkReturnEligibility('delivered', new Date(), 7, true)
      expect(result.eligible).toBe(false)
      expect(result.reason).toContain('already')
    })

    it('shows days remaining', () => {
      const delivered = new Date()
      delivered.setDate(delivered.getDate() - 5)
      const result = checkReturnEligibility('delivered', delivered, 7)
      expect(result.daysRemaining).toBe(2)
    })

    it('respects custom window', () => {
      const delivered = new Date()
      delivered.setDate(delivered.getDate() - 12)
      expect(checkReturnEligibility('delivered', delivered, 14).eligible).toBe(true)
      expect(checkReturnEligibility('delivered', delivered, 7).eligible).toBe(false)
    })
  })

  describe('Return Analytics', () => {
    it('calculates return rate', () => {
      expect(calculateReturnRate(5, 100)).toBe(5)
      expect(calculateReturnRate(0, 100)).toBe(0)
      expect(calculateReturnRate(5, 0)).toBe(0)
    })

    it('calculates average processing days', () => {
      const returns = [
        { requestedAt: new Date('2026-06-01'), resolvedAt: new Date('2026-06-04') }, // 3 days
        { requestedAt: new Date('2026-06-01'), resolvedAt: new Date('2026-06-06') }, // 5 days
      ]
      const avg = calculateAvgProcessingDays(returns)
      expect(avg).toBe(4) // (3 + 5) / 2
    })

    it('handles no resolved returns', () => {
      const returns = [{ requestedAt: new Date(), resolvedAt: null }]
      expect(calculateAvgProcessingDays(returns)).toBe(0)
    })
  })

  describe('Replacement Eligibility', () => {
    it('allows replacement for defective with stock', () => {
      expect(canReplace('defective', 5).eligible).toBe(true)
    })

    it('allows replacement for wrong_size', () => {
      expect(canReplace('wrong_size', 3).eligible).toBe(true)
    })

    it('rejects replacement for changed_mind', () => {
      const result = canReplace('changed_mind', 10)
      expect(result.eligible).toBe(false)
      expect(result.reason).toContain('Replacement only available')
    })

    it('rejects replacement when out of stock', () => {
      const result = canReplace('defective', 0)
      expect(result.eligible).toBe(false)
      expect(result.reason).toContain('out of stock')
    })
  })

  describe('RETURN_REASONS', () => {
    it('has all reason types', () => {
      const values = RETURN_REASONS.map((r) => r.value)
      expect(values).toContain('wrong_item')
      expect(values).toContain('defective')
      expect(values).toContain('changed_mind')
      expect(values).toContain('damaged_in_transit')
    })

    it('marks refund eligibility per reason', () => {
      const changedMind = RETURN_REASONS.find((r) => r.value === 'changed_mind')
      expect(changedMind?.refundEligible).toBe(true)
      const other = RETURN_REASONS.find((r) => r.value === 'other')
      expect(other?.refundEligible).toBe(false)
    })
  })
})
