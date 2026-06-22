import { describe, it, expect } from 'vitest'
import {
  isValidPOTransition,
  getNextPOStatuses,
  calculatePOTotals,
  calculateVendorRating,
  needsReorder,
  calculateReorderQuantity,
  generatePONumber,
  validateGoodsReceipt,
  PO_STATUSES,
} from '@/lib/procurement'

describe('Procurement Business Logic', () => {
  describe('PO State Machine', () => {
    it('allows draft → pending_approval', () => {
      expect(isValidPOTransition('draft', 'pending_approval')).toBe(true)
    })

    it('allows draft → approved (skip approval)', () => {
      expect(isValidPOTransition('draft', 'approved')).toBe(true)
    })

    it('allows approved → sent', () => {
      expect(isValidPOTransition('approved', 'sent')).toBe(true)
    })

    it('allows sent → partially_received', () => {
      expect(isValidPOTransition('sent', 'partially_received')).toBe(true)
    })

    it('allows sent → received', () => {
      expect(isValidPOTransition('sent', 'received')).toBe(true)
    })

    it('allows received → invoiced', () => {
      expect(isValidPOTransition('received', 'invoiced')).toBe(true)
    })

    it('rejects invoiced → anything (terminal)', () => {
      expect(isValidPOTransition('invoiced', 'draft')).toBe(false)
      expect(isValidPOTransition('invoiced', 'sent')).toBe(false)
    })

    it('rejects cancelled → anything (terminal)', () => {
      expect(isValidPOTransition('cancelled', 'draft')).toBe(false)
    })

    it('allows cancellation from most states', () => {
      expect(isValidPOTransition('draft', 'cancelled')).toBe(true)
      expect(isValidPOTransition('pending_approval', 'cancelled')).toBe(true)
      expect(isValidPOTransition('approved', 'cancelled')).toBe(true)
      expect(isValidPOTransition('sent', 'cancelled')).toBe(true)
    })

    it('allows same status (no-op)', () => {
      expect(isValidPOTransition('draft', 'draft')).toBe(true)
    })
  })

  describe('getNextPOStatuses', () => {
    it('returns valid next states for draft', () => {
      const next = getNextPOStatuses('draft')
      expect(next).toContain('pending_approval')
      expect(next).toContain('approved')
      expect(next).toContain('cancelled')
    })

    it('returns empty for terminal states', () => {
      expect(getNextPOStatuses('invoiced')).toHaveLength(0)
      expect(getNextPOStatuses('cancelled')).toHaveLength(0)
    })
  })

  describe('calculatePOTotals', () => {
    it('calculates simple totals without discount/tax', () => {
      const items = [
        { variantId: 'v1', quantity: 10, unitPrice: 100 },
        { variantId: 'v2', quantity: 5, unitPrice: 200 },
      ]
      const totals = calculatePOTotals(items)
      expect(totals.subtotal).toBe(2000) // 10*100 + 5*200
      expect(totals.grandTotal).toBe(2000)
      expect(totals.totalQuantity).toBe(15)
      expect(totals.lineCount).toBe(2)
    })

    it('applies discount correctly', () => {
      const items = [{ variantId: 'v1', quantity: 10, unitPrice: 100, discount: 10 }]
      const totals = calculatePOTotals(items)
      expect(totals.subtotal).toBe(1000)
      expect(totals.totalDiscount).toBe(100) // 10% of 1000
      expect(totals.grandTotal).toBe(900) // 1000 - 100
    })

    it('applies tax correctly', () => {
      const items = [{ variantId: 'v1', quantity: 10, unitPrice: 100, tax: 18 }]
      const totals = calculatePOTotals(items)
      expect(totals.subtotal).toBe(1000)
      expect(totals.totalTax).toBe(180) // 18% of 1000
      expect(totals.grandTotal).toBe(1180) // 1000 + 180
    })

    it('applies discount + tax correctly', () => {
      const items = [{ variantId: 'v1', quantity: 10, unitPrice: 100, discount: 10, tax: 18 }]
      const totals = calculatePOTotals(items)
      expect(totals.subtotal).toBe(1000)
      expect(totals.totalDiscount).toBe(100)
      expect(totals.totalTax).toBe(162) // 18% of 900 (after discount)
      expect(totals.grandTotal).toBe(1062) // 1000 - 100 + 162
    })

    it('handles empty items', () => {
      const totals = calculatePOTotals([])
      expect(totals.grandTotal).toBe(0)
      expect(totals.lineCount).toBe(0)
    })
  })

  describe('calculateVendorRating', () => {
    it('returns excellent for 90%+', () => {
      expect(calculateVendorRating(95, 92)).toBe('excellent')
    })

    it('returns good for 75-89%', () => {
      expect(calculateVendorRating(80, 78)).toBe('good')
    })

    it('returns average for 60-74%', () => {
      expect(calculateVendorRating(65, 70)).toBe('average')
    })

    it('returns poor for below 60%', () => {
      expect(calculateVendorRating(40, 50)).toBe('poor')
    })
  })

  describe('Auto-Reorder', () => {
    describe('needsReorder', () => {
      it('returns true when stock is at safety level', () => {
        expect(needsReorder(5, 10)).toBe(true)
      })

      it('returns false when stock is above safety level', () => {
        expect(needsReorder(20, 10)).toBe(false)
      })

      it('considers pending PO quantity', () => {
        expect(needsReorder(5, 10, 10)).toBe(false) // 5 + 10 > 10
        expect(needsReorder(5, 10, 3)).toBe(true)  // 5 + 3 <= 10
      })
    })

    describe('calculateReorderQuantity', () => {
      it('calculates quantity based on sales velocity', () => {
        // 2 units/day, 7 day lead time, 30 day buffer = (7+30)*2 = 74
        const qty = calculateReorderQuantity(2, 7, 1, 30)
        expect(qty).toBe(74)
      })

      it('respects MOQ', () => {
        // Need 74, MOQ is 25 → rounds up to 75
        const qty = calculateReorderQuantity(2, 7, 25, 30)
        expect(qty).toBe(75)
      })

      it('returns MOQ when demand is very low', () => {
        const qty = calculateReorderQuantity(0.1, 7, 50, 30)
        expect(qty).toBe(50) // MOQ minimum
      })
    })
  })

  describe('generatePONumber', () => {
    it('generates PO number with correct format', () => {
      const num = generatePONumber()
      expect(num).toMatch(/^PO-\d{4}-[A-Z0-9]{4}$/)
    })

    it('generates unique numbers', () => {
      const num1 = generatePONumber()
      const num2 = generatePONumber()
      expect(num1).not.toBe(num2)
    })
  })

  describe('validateGoodsReceipt', () => {
    it('validates correct receipt', () => {
      const items = [
        { poLineId: 'l1', orderedQty: 10, receivedQty: 10, acceptedQty: 8, rejectedQty: 2, rejectionReason: 'Damaged' },
      ]
      const result = validateGoodsReceipt(items)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('rejects negative receivedQty', () => {
      const items = [
        { poLineId: 'l1', orderedQty: 10, receivedQty: -1, acceptedQty: 0, rejectedQty: 0 },
      ]
      const result = validateGoodsReceipt(items)
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('negative')
    })

    it('rejects when accepted + rejected != received', () => {
      const items = [
        { poLineId: 'l1', orderedQty: 10, receivedQty: 10, acceptedQty: 5, rejectedQty: 3 },
      ]
      const result = validateGoodsReceipt(items)
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('equal Received')
    })

    it('rejects when received > ordered', () => {
      const items = [
        { poLineId: 'l1', orderedQty: 10, receivedQty: 15, acceptedQty: 15, rejectedQty: 0 },
      ]
      const result = validateGoodsReceipt(items)
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('exceeds ordered')
    })

    it('requires rejection reason when rejectedQty > 0', () => {
      const items = [
        { poLineId: 'l1', orderedQty: 10, receivedQty: 10, acceptedQty: 8, rejectedQty: 2 },
      ]
      const result = validateGoodsReceipt(items)
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('reason required')
    })
  })

  describe('PO_STATUSES', () => {
    it('has all required statuses', () => {
      const values = PO_STATUSES.map((s) => s.value)
      expect(values).toContain('draft')
      expect(values).toContain('pending_approval')
      expect(values).toContain('approved')
      expect(values).toContain('sent')
      expect(values).toContain('partially_received')
      expect(values).toContain('received')
      expect(values).toContain('invoiced')
      expect(values).toContain('cancelled')
    })
  })
})
