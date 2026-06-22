import { describe, it, expect } from 'vitest'
import {
  getVariantStockTotal,
  getVariantLowStockThreshold,
  getDefaultVariant,
  getVariantStockSummary,
} from '@/lib/variant-stock'

describe('Variant Stock Utilities', () => {
  const mockProduct = {
    colors: [
      {
        colorName: 'Red',
        variants: [
          { id: 'v1', size: 'S', stock: 10, isActive: true, sortOrder: 0 },
          { id: 'v2', size: 'M', stock: 5, isActive: true, sortOrder: 1 },
          { id: 'v3', size: 'L', stock: 0, isActive: true, sortOrder: 2 },
        ],
      },
      {
        colorName: 'Blue',
        variants: [
          { id: 'v4', size: 'S', stock: 3, isActive: true, sortOrder: 0 },
          { id: 'v5', size: 'M', stock: 0, isActive: false, sortOrder: 1 },
        ],
      },
    ],
    lowStockThreshold: 5,
  }

  describe('getVariantStockTotal', () => {
    it('sums stock of all active variants across colors', () => {
      const total = getVariantStockTotal(mockProduct)
      // v1=10, v2=5, v3=0, v4=3 (v5 is inactive)
      expect(total).toBe(18)
    })

    it('returns 0 for product with no colors', () => {
      expect(getVariantStockTotal({ colors: [] })).toBe(0)
    })

    it('returns 0 for product with no variants', () => {
      expect(getVariantStockTotal({ colors: [{ variants: [] }] })).toBe(0)
    })

    it('handles null/undefined stock values', () => {
      const product = {
        colors: [{ variants: [{ stock: null, isActive: true }, { stock: undefined, isActive: true }] }],
      }
      expect(getVariantStockTotal(product)).toBe(0)
    })

    it('handles product with variants at top level (no colors)', () => {
      const product = {
        variants: [
          { stock: 10, isActive: true, sortOrder: 0 },
          { stock: 5, isActive: true, sortOrder: 1 },
        ],
      }
      expect(getVariantStockTotal(product)).toBe(15)
    })
  })

  describe('getVariantLowStockThreshold', () => {
    it('returns product threshold when set', () => {
      expect(getVariantLowStockThreshold(mockProduct)).toBe(5)
    })

    it('returns default fallback of 10 when not set', () => {
      expect(getVariantLowStockThreshold({})).toBe(10)
    })

    it('returns custom fallback when provided', () => {
      expect(getVariantLowStockThreshold({}, 20)).toBe(20)
    })

    it('handles null threshold', () => {
      expect(getVariantLowStockThreshold({ lowStockThreshold: null })).toBe(10)
    })

    it('handles non-finite threshold', () => {
      expect(getVariantLowStockThreshold({ lowStockThreshold: NaN })).toBe(10)
    })
  })

  describe('getDefaultVariant', () => {
    it('returns first in-stock active variant', () => {
      const variant = getDefaultVariant(mockProduct)
      expect(variant).not.toBeNull()
      expect(variant?.id).toBe('v1')
    })

    it('returns first active variant if all are out of stock', () => {
      const product = {
        colors: [{ variants: [{ id: 'v1', stock: 0, isActive: true, sortOrder: 0 }] }],
      }
      const variant = getDefaultVariant(product)
      expect(variant?.id).toBe('v1')
    })

    it('returns null for product with no variants', () => {
      expect(getDefaultVariant({ colors: [] })).toBeNull()
    })

    it('skips inactive variants', () => {
      const product = {
        colors: [
          {
            variants: [
              { id: 'v1', stock: 10, isActive: false, sortOrder: 0 },
              { id: 'v2', stock: 5, isActive: true, sortOrder: 1 },
            ],
          },
        ],
      }
      const variant = getDefaultVariant(product)
      expect(variant?.id).toBe('v2')
    })
  })

  describe('getVariantStockSummary', () => {
    it('returns correct summary object', () => {
      const summary = getVariantStockSummary(mockProduct)
      expect(summary.total).toBe(18)
      expect(summary.hasVariants).toBe(true)
    })

    it('identifies active variants correctly', () => {
      const summary = getVariantStockSummary(mockProduct)
      // v1, v2, v3, v4 are active (v5 inactive)
      expect(summary.activeVariants).toHaveLength(4)
    })

    it('identifies low stock variants', () => {
      const summary = getVariantStockSummary(mockProduct)
      // threshold=5: v2 (stock=5) and v4 (stock=3) are low stock
      expect(summary.lowStockVariants).toHaveLength(2)
    })

    it('identifies out of stock variants', () => {
      const summary = getVariantStockSummary(mockProduct)
      // v3 (stock=0) and v5 (stock=0, but inactive so excluded from active)
      expect(summary.outOfStockVariants.length).toBeGreaterThanOrEqual(1)
    })

    it('returns hasVariants=false for empty product', () => {
      const summary = getVariantStockSummary({ colors: [] })
      expect(summary.hasVariants).toBe(false)
      expect(summary.total).toBe(0)
    })
  })
})
