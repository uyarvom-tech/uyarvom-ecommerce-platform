import { describe, it, expect } from 'vitest'
import {
  calculateForecast,
  validateStockAdjustment,
  validateTransfer,
  generateBatchNumber,
  isExpired,
  daysUntilExpiry,
  ADJUSTMENT_REASONS,
} from '@/lib/inventory'

describe('Inventory Business Logic', () => {
  describe('calculateForecast', () => {
    it('calculates average daily sales correctly', () => {
      const result = calculateForecast(100, 30, 30)
      expect(result.avgDailySales).toBe(1) // 30 sold in 30 days = 1/day
    })

    it('calculates days of stock remaining', () => {
      const result = calculateForecast(100, 30, 30)
      expect(result.daysOfStockRemaining).toBe(100) // 100 stock / 1 per day
    })

    it('returns Infinity for days remaining when no sales', () => {
      const result = calculateForecast(50, 0, 30)
      expect(result.daysOfStockRemaining).toBe(Infinity)
    })

    it('calculates reorder point based on lead time + safety stock', () => {
      // Lead time 7 days, safety 3 days, 1 unit/day = reorder at 10
      const result = calculateForecast(100, 30, 30, 7, 3)
      expect(result.reorderPoint).toBe(10)
    })

    it('suggests reorder quantity correctly', () => {
      // Current: 5, avgDaily: 2, leadTime: 7 → need (7+30)*2 - 5 = 69
      const result = calculateForecast(5, 60, 30, 7, 3)
      expect(result.suggestedReorderQuantity).toBe(69)
    })

    it('suggests 0 reorder when well-stocked', () => {
      const result = calculateForecast(500, 10, 30, 7, 3)
      expect(result.suggestedReorderQuantity).toBe(0)
    })

    it('returns critical status when stock is 0', () => {
      const result = calculateForecast(0, 30, 30)
      expect(result.status).toBe('critical')
    })

    it('returns low status when below reorder point', () => {
      // 5 stock, 30 sold in 30 days (1/day), reorder point = (7+3)*1 = 10
      const result = calculateForecast(5, 30, 30, 7, 3)
      expect(result.status).toBe('low')
    })

    it('returns adequate status for normal stock levels', () => {
      const result = calculateForecast(50, 30, 30, 7, 3)
      expect(result.status).toBe('adequate')
    })

    it('returns overstocked when stock exceeds 90 days of sales', () => {
      // avgDaily = 1, stock = 100 > 90 days of sales
      const result = calculateForecast(100, 30, 30, 7, 3)
      expect(result.status).toBe('overstocked')
    })

    it('handles zero period days gracefully', () => {
      const result = calculateForecast(50, 0, 0)
      expect(result.avgDailySales).toBe(0)
      expect(result.daysOfStockRemaining).toBe(Infinity)
    })
  })

  describe('validateStockAdjustment', () => {
    it('validates increment correctly', () => {
      const result = validateStockAdjustment(10, { type: 'increment', quantity: 5 })
      expect(result.valid).toBe(true)
      expect(result.resultingStock).toBe(15)
    })

    it('validates decrement correctly', () => {
      const result = validateStockAdjustment(10, { type: 'decrement', quantity: 3 })
      expect(result.valid).toBe(true)
      expect(result.resultingStock).toBe(7)
    })

    it('rejects decrement below zero', () => {
      const result = validateStockAdjustment(5, { type: 'decrement', quantity: 10 })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Insufficient stock')
    })

    it('validates set correctly', () => {
      const result = validateStockAdjustment(10, { type: 'set', quantity: 25 })
      expect(result.valid).toBe(true)
      expect(result.resultingStock).toBe(25)
    })

    it('rejects negative quantity', () => {
      const result = validateStockAdjustment(10, { type: 'increment', quantity: -5 })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('non-negative')
    })

    it('rejects NaN quantity', () => {
      const result = validateStockAdjustment(10, { type: 'increment', quantity: NaN })
      expect(result.valid).toBe(false)
    })

    it('rejects stock exceeding 999999', () => {
      const result = validateStockAdjustment(999990, { type: 'increment', quantity: 100 })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('999,999')
    })

    it('allows zero quantity (no-op)', () => {
      const result = validateStockAdjustment(10, { type: 'increment', quantity: 0 })
      expect(result.valid).toBe(true)
      expect(result.resultingStock).toBe(10)
    })
  })

  describe('validateTransfer', () => {
    it('validates a valid transfer', () => {
      const result = validateTransfer(50, 10, 'wh-1', 'wh-2')
      expect(result.valid).toBe(true)
    })

    it('rejects same source and destination', () => {
      const result = validateTransfer(50, 10, 'wh-1', 'wh-1')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('different')
    })

    it('rejects zero quantity', () => {
      const result = validateTransfer(50, 0, 'wh-1', 'wh-2')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('positive')
    })

    it('rejects negative quantity', () => {
      const result = validateTransfer(50, -5, 'wh-1', 'wh-2')
      expect(result.valid).toBe(false)
    })

    it('rejects when quantity exceeds source stock', () => {
      const result = validateTransfer(5, 10, 'wh-1', 'wh-2')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Insufficient stock')
    })

    it('allows transfer of exact available stock', () => {
      const result = validateTransfer(10, 10, 'wh-1', 'wh-2')
      expect(result.valid).toBe(true)
    })
  })

  describe('generateBatchNumber', () => {
    it('generates a batch number with default prefix', () => {
      const batch = generateBatchNumber()
      expect(batch).toMatch(/^LOT-\d{8}-[A-Z0-9]{4}$/)
    })

    it('uses custom prefix', () => {
      const batch = generateBatchNumber('BATCH')
      expect(batch.startsWith('BATCH-')).toBe(true)
    })

    it('generates unique numbers', () => {
      const batch1 = generateBatchNumber()
      const batch2 = generateBatchNumber()
      expect(batch1).not.toBe(batch2)
    })
  })

  describe('isExpired', () => {
    it('returns false for null expiry', () => {
      expect(isExpired(null)).toBe(false)
    })

    it('returns true for past date', () => {
      expect(isExpired(new Date('2020-01-01'))).toBe(true)
    })

    it('returns false for future date', () => {
      const future = new Date()
      future.setFullYear(future.getFullYear() + 1)
      expect(isExpired(future)).toBe(false)
    })

    it('handles string dates', () => {
      expect(isExpired('2020-01-01')).toBe(true)
    })
  })

  describe('daysUntilExpiry', () => {
    it('returns null for null expiry', () => {
      expect(daysUntilExpiry(null)).toBeNull()
    })

    it('returns negative for expired items', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 5)
      const days = daysUntilExpiry(pastDate)
      expect(days).not.toBeNull()
      expect(days!).toBeLessThanOrEqual(-4)
    })

    it('returns positive for future expiry', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 10)
      const days = daysUntilExpiry(futureDate)
      expect(days).not.toBeNull()
      expect(days!).toBeGreaterThanOrEqual(9)
    })
  })

  describe('ADJUSTMENT_REASONS', () => {
    it('has all required reason codes', () => {
      const values = ADJUSTMENT_REASONS.map((r) => r.value)
      expect(values).toContain('received')
      expect(values).toContain('returned')
      expect(values).toContain('damaged')
      expect(values).toContain('lost')
      expect(values).toContain('correction')
      expect(values).toContain('transfer_in')
      expect(values).toContain('transfer_out')
      expect(values).toContain('reserved')
      expect(values).toContain('released')
      expect(values).toContain('sold')
    })

    it('each reason has a label', () => {
      for (const reason of ADJUSTMENT_REASONS) {
        expect(reason.label).toBeTruthy()
        expect(reason.label.length).toBeGreaterThan(3)
      }
    })
  })
})
