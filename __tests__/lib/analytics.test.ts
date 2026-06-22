import { describe, it, expect } from 'vitest'
import {
  aggregateRevenueTrends,
  calculateYoYGrowth,
  calculateMargins,
  calculateInventoryValue,
  calculateRepeatRate,
  calculateChurnRate,
  calculateNPS,
  calculateWarehouseMetrics,
  calculateSupplierScore,
  toCSV,
} from '@/lib/analytics'

describe('Analytics & Dashboards', () => {
  describe('Revenue Trends', () => {
    const orders = [
      { total: 1000, createdAt: new Date('2026-06-01') },
      { total: 1500, createdAt: new Date('2026-06-01') },
      { total: 800, createdAt: new Date('2026-06-02') },
      { total: 2000, createdAt: new Date('2026-06-03') },
    ]

    it('aggregates daily trends', () => {
      const trends = aggregateRevenueTrends(orders, 'daily')
      expect(trends).toHaveLength(3)
      expect(trends[0].period).toBe('2026-06-01')
      expect(trends[0].revenue).toBe(2500)
      expect(trends[0].orders).toBe(2)
      expect(trends[0].avgOrderValue).toBe(1250)
    })

    it('aggregates monthly trends', () => {
      const trends = aggregateRevenueTrends(orders, 'monthly')
      expect(trends).toHaveLength(1)
      expect(trends[0].period).toBe('2026-06')
      expect(trends[0].revenue).toBe(5300)
    })

    it('handles empty orders', () => {
      const trends = aggregateRevenueTrends([], 'daily')
      expect(trends).toHaveLength(0)
    })

    it('sorts by period ascending', () => {
      const unsorted = [
        { total: 100, createdAt: new Date('2026-06-15') },
        { total: 200, createdAt: new Date('2026-06-01') },
      ]
      const trends = aggregateRevenueTrends(unsorted, 'daily')
      expect(trends[0].period).toBe('2026-06-01')
      expect(trends[1].period).toBe('2026-06-15')
    })
  })

  describe('YoY Growth', () => {
    it('calculates positive growth', () => {
      expect(calculateYoYGrowth(120000, 100000)).toBe(20)
    })

    it('calculates negative growth', () => {
      expect(calculateYoYGrowth(80000, 100000)).toBe(-20)
    })

    it('handles zero previous (100% growth)', () => {
      expect(calculateYoYGrowth(50000, 0)).toBe(100)
    })

    it('handles zero both', () => {
      expect(calculateYoYGrowth(0, 0)).toBe(0)
    })
  })

  describe('Margin Tracking', () => {
    it('calculates gross and net margins', () => {
      const m = calculateMargins(100000, 40000, 20000)
      expect(m.grossProfit).toBe(60000)
      expect(m.grossMargin).toBe(60)
      expect(m.netProfit).toBe(40000)
      expect(m.netMargin).toBe(40)
    })

    it('handles zero revenue', () => {
      const m = calculateMargins(0, 0, 0)
      expect(m.grossMargin).toBe(0)
      expect(m.netMargin).toBe(0)
    })
  })

  describe('Inventory Value', () => {
    it('calculates total inventory value', () => {
      const items = [
        { stock: 10, buyingPrice: 300, sellingPrice: 600 },
        { stock: 5, buyingPrice: 500, sellingPrice: 1000 },
      ]
      const val = calculateInventoryValue(items)
      expect(val.totalUnits).toBe(15)
      expect(val.totalCostValue).toBe(5500) // 10*300 + 5*500
      expect(val.totalRetailValue).toBe(11000) // 10*600 + 5*1000
      expect(val.potentialProfit).toBe(5500)
      expect(val.avgCostPerUnit).toBe(367) // 5500/15 rounded
    })

    it('handles empty inventory', () => {
      const val = calculateInventoryValue([])
      expect(val.totalUnits).toBe(0)
      expect(val.avgCostPerUnit).toBe(0)
    })
  })

  describe('Customer Analytics', () => {
    it('calculates repeat purchase rate', () => {
      expect(calculateRepeatRate(100, 30)).toBe(30)
      expect(calculateRepeatRate(0, 0)).toBe(0)
    })

    it('calculates churn rate', () => {
      expect(calculateChurnRate(100, 15)).toBe(15)
      expect(calculateChurnRate(0, 0)).toBe(0)
    })

    it('calculates NPS from ratings', () => {
      // 5=promoter, 4=passive, 1-3=detractor
      const ratings = [5, 5, 5, 4, 4, 3, 2, 1] // 3 promoters, 3 detractors = (3-3)/8*100 = 0
      expect(calculateNPS(ratings)).toBe(0)
    })

    it('NPS with all promoters = 100', () => {
      expect(calculateNPS([5, 5, 5, 5])).toBe(100)
    })

    it('NPS with all detractors = -100', () => {
      expect(calculateNPS([1, 2, 3, 1])).toBe(-100)
    })

    it('NPS handles empty', () => {
      expect(calculateNPS([])).toBe(0)
    })
  })

  describe('Warehouse Metrics', () => {
    it('calculates warehouse productivity', () => {
      const m = calculateWarehouseMetrics(100, 8, 2, 100, 1, 100)
      expect(m.ordersProcessed).toBe(100)
      expect(m.throughput).toBe(12.5) // 100/8
      expect(m.pickAccuracy).toBe(98)
      expect(m.packAccuracy).toBe(99)
    })

    it('handles zero hours', () => {
      const m = calculateWarehouseMetrics(0, 0, 0, 0, 0, 0)
      expect(m.throughput).toBe(0)
      expect(m.pickAccuracy).toBe(100)
    })
  })

  describe('Supplier Scorecards', () => {
    it('calculates weighted score (60% on-time + 40% quality)', () => {
      expect(calculateSupplierScore(90, 80)).toBe(86) // 90*0.6 + 80*0.4 = 54 + 32
      expect(calculateSupplierScore(100, 100)).toBe(100)
      expect(calculateSupplierScore(0, 0)).toBe(0)
    })
  })

  describe('Report Export', () => {
    it('generates CSV from data', () => {
      const csv = toCSV(['Name', 'Price'], [['Bowl', '599'], ['Plate', '399']])
      expect(csv).toContain('Name,Price')
      expect(csv).toContain('Bowl,599')
      expect(csv).toContain('Plate,399')
    })

    it('escapes commas in CSV', () => {
      const csv = toCSV(['Desc'], [['A bowl, nice']])
      expect(csv).toContain('"A bowl, nice"')
    })

    it('handles null/undefined', () => {
      const csv = toCSV(['A', 'B'], [[null, undefined]])
      expect(csv).toContain('A,B')
      expect(csv).toContain(',') // empty values separated by comma
    })
  })
})
