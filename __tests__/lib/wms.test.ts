import { describe, it, expect } from 'vitest'
import {
  generateBinCode,
  parseBinCode,
  optimizePickList,
  validatePack,
  generateShippingLabel,
  calculatePerformance,
  analyzeCycleCount,
  generatePickListNumber,
} from '@/lib/wms'

describe('WMS Business Logic', () => {
  describe('Bin Management', () => {
    it('generates bin code from components', () => {
      expect(generateBinCode('A', 3, 2, 5)).toBe('ZA-A03-S02-P05')
    })

    it('handles single-digit values with padding', () => {
      expect(generateBinCode('B', 1, 1, 1)).toBe('ZB-A01-S01-P01')
    })

    it('uppercases zone', () => {
      expect(generateBinCode('c', 2, 3, 4)).toBe('ZC-A02-S03-P04')
    })

    it('parses valid bin code', () => {
      const result = parseBinCode('ZA-A03-S02-P05')
      expect(result).toEqual({ zone: 'A', aisle: 3, shelf: 2, position: 5 })
    })

    it('returns null for invalid bin code', () => {
      expect(parseBinCode('invalid')).toBeNull()
      expect(parseBinCode('')).toBeNull()
      expect(parseBinCode('Z-A01-S01-P01')).toBeNull()
    })

    it('parses double-digit values', () => {
      const result = parseBinCode('ZB-A12-S05-P08')
      expect(result).toEqual({ zone: 'B', aisle: 12, shelf: 5, position: 8 })
    })
  })

  describe('Pick List Optimization', () => {
    it('sorts items by zone then aisle', () => {
      const items = [
        { orderItemId: '1', variantId: 'v1', productName: 'Bowl', variantLabel: 'Red/M', quantity: 2, zone: 'B', aisle: 2 },
        { orderItemId: '2', variantId: 'v2', productName: 'Plate', variantLabel: 'Blue/L', quantity: 1, zone: 'A', aisle: 1 },
        { orderItemId: '3', variantId: 'v3', productName: 'Cup', variantLabel: 'Green/S', quantity: 3, zone: 'A', aisle: 3 },
      ]
      const result = optimizePickList(items)
      expect(result.items[0].zone).toBe('A')
      expect(result.items[0].aisle).toBe(1)
      expect(result.items[1].zone).toBe('A')
      expect(result.items[1].aisle).toBe(3)
      expect(result.items[2].zone).toBe('B')
    })

    it('calculates total quantity', () => {
      const items = [
        { orderItemId: '1', variantId: 'v1', productName: 'A', variantLabel: '', quantity: 5 },
        { orderItemId: '2', variantId: 'v2', productName: 'B', variantLabel: '', quantity: 3 },
      ]
      const result = optimizePickList(items)
      expect(result.totalQuantity).toBe(8)
      expect(result.totalItems).toBe(2)
    })

    it('identifies unique zones', () => {
      const items = [
        { orderItemId: '1', variantId: 'v1', productName: 'A', variantLabel: '', quantity: 1, zone: 'A' },
        { orderItemId: '2', variantId: 'v2', productName: 'B', variantLabel: '', quantity: 1, zone: 'A' },
        { orderItemId: '3', variantId: 'v3', productName: 'C', variantLabel: '', quantity: 1, zone: 'B' },
      ]
      const result = optimizePickList(items)
      expect(result.zones).toEqual(['A', 'B'])
    })

    it('estimates pick time', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({
        orderItemId: `${i}`, variantId: `v${i}`, productName: `P${i}`, variantLabel: '', quantity: 1, zone: 'A',
      }))
      const result = optimizePickList(items)
      expect(result.estimatedTime).toBeGreaterThan(0)
    })

    it('handles empty items', () => {
      const result = optimizePickList([])
      expect(result.totalItems).toBe(0)
      expect(result.totalQuantity).toBe(0)
    })
  })

  describe('Pack Validation', () => {
    it('validates a correct pack', () => {
      const result = validatePack({
        orderId: 'o1',
        weight: 500,
        length: 30,
        width: 20,
        height: 10,
        items: [{ variantId: 'v1', quantity: 2, verified: true }],
      })
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('rejects zero weight', () => {
      const result = validatePack({
        orderId: 'o1', weight: 0, length: 10, width: 10, height: 10,
        items: [{ variantId: 'v1', quantity: 1, verified: true }],
      })
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('Weight')
    })

    it('rejects unverified items', () => {
      const result = validatePack({
        orderId: 'o1', weight: 500, length: 10, width: 10, height: 10,
        items: [{ variantId: 'v1', quantity: 1, verified: false }],
      })
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('not verified')
    })

    it('rejects empty items', () => {
      const result = validatePack({ orderId: 'o1', weight: 500, length: 10, width: 10, height: 10, items: [] })
      expect(result.valid).toBe(false)
    })

    it('warns on oversized package', () => {
      const result = validatePack({
        orderId: 'o1', weight: 500, length: 160, width: 10, height: 10,
        items: [{ variantId: 'v1', quantity: 1, verified: true }],
      })
      expect(result.valid).toBe(true)
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('warns on heavy package', () => {
      const result = validatePack({
        orderId: 'o1', weight: 35000, length: 10, width: 10, height: 10,
        items: [{ variantId: 'v1', quantity: 1, verified: true }],
      })
      expect(result.valid).toBe(true)
      expect(result.warnings.some((w) => w.includes('30kg'))).toBe(true)
    })
  })

  describe('Shipping Label', () => {
    it('generates label with correct structure', () => {
      const label = generateShippingLabel({
        orderNumber: 'ORD-001',
        customerName: 'John',
        address: '123 St',
        city: 'Chennai',
        state: 'TN',
        pincode: '600001',
        phone: '9876543210',
        weight: 500,
        courierName: 'Delhivery',
        trackingNumber: 'DLV123',
      })
      expect(label.fromAddress).toContain('Uyarvom')
      expect(label.toAddress).toContain('John')
      expect(label.toAddress).toContain('Chennai')
      expect(label.barcode).toBe('DLV123')
      expect(label.metadata.courier).toBe('Delhivery')
    })

    it('uses order number as barcode when no tracking', () => {
      const label = generateShippingLabel({
        orderNumber: 'ORD-999',
        customerName: 'Jane',
        address: '456 Ave',
        city: 'Mumbai',
        state: 'MH',
        pincode: '400001',
        phone: '1234567890',
        weight: 200,
      })
      expect(label.barcode).toBe('ORD-999')
      expect(label.metadata.cod).toBe('Prepaid')
    })

    it('shows COD amount for COD orders', () => {
      const label = generateShippingLabel({
        orderNumber: 'ORD-COD',
        customerName: 'Test',
        address: 'Addr',
        city: 'City',
        state: 'ST',
        pincode: '000000',
        phone: '0000000000',
        weight: 100,
        codAmount: 1500,
      })
      expect(label.metadata.cod).toBe('₹1500')
    })
  })

  describe('Performance Metrics', () => {
    it('calculates picks per hour', () => {
      const metrics = calculatePerformance(120, 40, 2, 4, 3600, 2400)
      expect(metrics.picksPerHour).toBe(30) // 120 picks / 4 hours
      expect(metrics.packsPerHour).toBe(10) // 40 packs / 4 hours
    })

    it('calculates accuracy rate', () => {
      const metrics = calculatePerformance(100, 50, 5, 4, 3000, 2000)
      // (150 - 5) / 150 * 100 = 96.7%
      expect(metrics.accuracyRate).toBe(96.7)
    })

    it('calculates average times', () => {
      const metrics = calculatePerformance(100, 50, 0, 8, 5000, 3000)
      expect(metrics.avgPickTime).toBe(50) // 5000 / 100
      expect(metrics.avgPackTime).toBe(60) // 3000 / 50
    })

    it('handles zero hours gracefully', () => {
      const metrics = calculatePerformance(0, 0, 0, 0, 0, 0)
      expect(metrics.picksPerHour).toBe(0)
      expect(metrics.accuracyRate).toBe(100)
    })
  })

  describe('Cycle Counting', () => {
    it('identifies discrepancies', () => {
      const items = [
        { binCode: 'ZA-A01-S01-P01', variantId: 'v1', expectedQty: 10, actualQty: 10 },
        { binCode: 'ZA-A01-S01-P02', variantId: 'v2', expectedQty: 5, actualQty: 3 },
        { binCode: 'ZA-A02-S01-P01', variantId: 'v3', expectedQty: 8, actualQty: 10 },
      ]
      const result = analyzeCycleCount(items)
      expect(result.totalBins).toBe(3)
      expect(result.matchedBins).toBe(1)
      expect(result.discrepancies).toHaveLength(2)
      expect(result.discrepancies[0].variance).toBe(-2) // 3 - 5
      expect(result.discrepancies[1].variance).toBe(2) // 10 - 8
    })

    it('calculates accuracy rate', () => {
      const items = [
        { binCode: 'B1', variantId: 'v1', expectedQty: 10, actualQty: 10 },
        { binCode: 'B2', variantId: 'v2', expectedQty: 5, actualQty: 5 },
        { binCode: 'B3', variantId: 'v3', expectedQty: 3, actualQty: 3 },
        { binCode: 'B4', variantId: 'v4', expectedQty: 7, actualQty: 6 },
      ]
      const result = analyzeCycleCount(items)
      expect(result.accuracyRate).toBe(75) // 3/4 matched
    })

    it('handles all matched (100% accuracy)', () => {
      const items = [
        { binCode: 'B1', variantId: 'v1', expectedQty: 10, actualQty: 10 },
      ]
      const result = analyzeCycleCount(items)
      expect(result.accuracyRate).toBe(100)
      expect(result.discrepancies).toHaveLength(0)
    })

    it('handles empty items', () => {
      const result = analyzeCycleCount([])
      expect(result.accuracyRate).toBe(100)
      expect(result.totalBins).toBe(0)
    })
  })

  describe('generatePickListNumber', () => {
    it('generates unique pick list numbers', () => {
      const n1 = generatePickListNumber()
      const n2 = generatePickListNumber()
      expect(n1).toMatch(/^PL-\d+-[A-Z0-9]+$/)
      expect(n1).not.toBe(n2)
    })
  })
})
