import { describe, it, expect } from 'vitest'
import {
  forecastDemand,
  calculateEOQ,
  getReorderUrgency,
  suggestDynamicPrice,
  scoreContentBased,
  scoreCollaborative,
  predictChurn,
  scoreFraudRisk,
  generateProcurementSuggestion,
  classifyIntent,
  assignVariant,
  determineWinner,
} from '@/lib/ai-features'

describe('AI Features', () => {
  describe('Demand Forecasting', () => {
    it('forecasts from recent + older sales', () => {
      const forecast = forecastDemand([5, 4, 6, 5, 7, 4, 5], [3, 3, 2, 4, 3, 2, 3], 50)
      expect(forecast.predictedDailySales).toBeGreaterThan(3)
      expect(forecast.predictedWeeklySales).toBe(forecast.predictedDailySales * 7)
      expect(forecast.trend).toBe('rising') // Recent > older
    })

    it('detects declining trend', () => {
      const forecast = forecastDemand([1, 2, 1, 1, 2, 1, 1], [5, 6, 4, 5, 6, 5, 4], 100)
      expect(forecast.trend).toBe('declining')
    })

    it('detects stable trend', () => {
      const forecast = forecastDemand([3, 3, 3, 3], [3, 3, 3, 3], 50)
      expect(forecast.trend).toBe('stable')
    })

    it('applies seasonal multiplier', () => {
      const base = forecastDemand([5, 5, 5], [5, 5, 5], 50, 1.0)
      const festive = forecastDemand([5, 5, 5], [5, 5, 5], 50, 1.5)
      expect(festive.predictedDailySales).toBeGreaterThan(base.predictedDailySales)
    })

    it('confidence based on data points', () => {
      const full = forecastDemand([1,2,3,4,5,6,7], Array(23).fill(3), 50)
      const sparse = forecastDemand([3], [], 50)
      expect(full.confidence).toBeGreaterThan(sparse.confidence)
    })

    it('handles empty sales data', () => {
      const forecast = forecastDemand([], [], 50)
      expect(forecast.predictedDailySales).toBe(0)
    })
  })

  describe('Inventory Optimization (EOQ)', () => {
    it('calculates EOQ correctly', () => {
      // Annual demand 1000, order cost 500, holding cost 50
      // EOQ = sqrt(2*1000*500/50) = sqrt(20000) ≈ 141
      const eoq = calculateEOQ(1000, 500, 50)
      expect(eoq).toBe(142) // ceil(141.4)
    })

    it('returns 0 for zero demand', () => {
      expect(calculateEOQ(0)).toBe(0)
    })

    it('minimum EOQ is 1', () => {
      expect(calculateEOQ(1, 1, 1000)).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Reorder Urgency', () => {
    it('critical when stockout imminent', () => {
      expect(getReorderUrgency(0)).toBe('critical')
      expect(getReorderUrgency(-1)).toBe('critical')
    })

    it('soon within 7 days', () => {
      expect(getReorderUrgency(5)).toBe('soon')
    })

    it('planned within 30 days', () => {
      expect(getReorderUrgency(15)).toBe('planned')
    })

    it('ok beyond 30 days', () => {
      expect(getReorderUrgency(60)).toBe('ok')
    })
  })

  describe('Dynamic Pricing', () => {
    it('suggests increase for high demand + low stock', () => {
      const s = suggestDynamicPrice(500, 'rising', 5)
      expect(s.suggestedPrice).toBeGreaterThan(500)
      expect(s.changePercent).toBeGreaterThan(0)
    })

    it('suggests decrease for low demand + high stock', () => {
      const s = suggestDynamicPrice(500, 'declining', 90)
      expect(s.suggestedPrice).toBeLessThan(500)
      expect(s.changePercent).toBeLessThan(0)
    })

    it('stays stable for moderate conditions', () => {
      const s = suggestDynamicPrice(500, 'stable', 30)
      expect(s.suggestedPrice).toBe(500)
      expect(s.changePercent).toBe(0)
    })

    it('considers competitor pricing', () => {
      const below = suggestDynamicPrice(500, 'stable', 30, 800) // Competitor is higher
      expect(below.suggestedPrice).toBeGreaterThanOrEqual(500)
    })
  })

  describe('Product Recommendations', () => {
    it('scores higher for same category', () => {
      const same = scoreContentBased('bowls', 'bowls', [300, 800], 500, 50)
      const diff = scoreContentBased('bowls', 'plates', [300, 800], 500, 50)
      expect(same).toBeGreaterThan(diff)
    })

    it('scores higher for in-range price', () => {
      const inRange = scoreContentBased('bowls', 'bowls', [300, 800], 500, 50)
      const outRange = scoreContentBased('bowls', 'bowls', [300, 800], 5000, 50)
      expect(inRange).toBeGreaterThan(outRange)
    })

    it('caps score at 100', () => {
      const score = scoreContentBased('a', 'a', [0, 10000], 500, 100)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('collaborative scoring based on co-purchase rate', () => {
      expect(scoreCollaborative(10, 100)).toBe(50) // 10% rate * 500
      expect(scoreCollaborative(0, 100)).toBe(0)
      expect(scoreCollaborative(0, 0)).toBe(0)
    })
  })

  describe('Churn Prediction', () => {
    it('predicts high churn for inactive customer', () => {
      const p = predictChurn(100, 60, 2, 3, true)
      expect(p.churnProbability).toBeGreaterThan(0.6)
      expect(p.riskLevel).toBe('high')
      expect(p.signals.length).toBeGreaterThan(2)
    })

    it('predicts low churn for active customer', () => {
      const p = predictChurn(5, 0, 4.5, 0, false)
      expect(p.churnProbability).toBeLessThan(0.3)
      expect(p.riskLevel).toBe('low')
    })

    it('suggests win-back for high risk', () => {
      const p = predictChurn(200, 80, 1, 5, true)
      expect(p.suggestedAction).toContain('win-back')
    })

    it('suggests recommendations for medium risk', () => {
      const p = predictChurn(65, 30, 4, 0, true)
      // 65 days = 0.15, 30% decline = 0.1, cart = 0.1 → total 0.35 = medium
      expect(p.riskLevel).toBe('medium')
      expect(p.suggestedAction).toContain('recommendations')
    })
  })

  describe('Fraud Detection', () => {
    it('flags high-risk order', () => {
      const r = scoreFraudRisk(50000, 2000, true, true, 3, true, true)
      expect(r.riskLevel).toBe('high')
      expect(r.recommendation).toBe('block')
      expect(r.flags.length).toBeGreaterThan(3)
    })

    it('allows normal order', () => {
      const r = scoreFraudRisk(1500, 1000, false, false, 0, false, false)
      expect(r.riskLevel).toBe('low')
      expect(r.recommendation).toBe('allow')
    })

    it('flags for review on moderate signals', () => {
      const r = scoreFraudRisk(10000, 2000, true, false, 2, false, true)
      expect(r.riskLevel).toBe('medium')
      expect(r.recommendation).toBe('review')
    })

    it('risk score capped at 100', () => {
      const r = scoreFraudRisk(100000, 100, true, true, 5, true, true)
      expect(r.riskScore).toBeLessThanOrEqual(100)
    })
  })

  describe('Procurement Suggestions', () => {
    it('calculates urgency correctly', () => {
      // Stock: 10, sells 5/day, lead time 7 days → stockout in 2 days → immediate
      const s = generateProcurementSuggestion(10, 5, 7, 300, 10)
      expect(s.urgency).toBe('immediate')
      expect(s.daysUntilStockout).toBe(2)
    })

    it('suggests quantity based on MOQ', () => {
      const s = generateProcurementSuggestion(50, 2, 7, 100, 25)
      expect(s.suggestedOrderQty % 25).toBe(0) // Multiple of MOQ
    })

    it('handles zero sales rate', () => {
      const s = generateProcurementSuggestion(100, 0, 7, 100)
      expect(s.daysUntilStockout).toBe(Infinity)
      expect(s.urgency).toBe('next_month')
    })
  })

  describe('AI Chatbot', () => {
    it('classifies order tracking intent', () => {
      const r = classifyIntent('Where is my order?')
      expect(r.intent).toBe('order_status')
      expect(r.confidence).toBeGreaterThan(0.7)
    })

    it('classifies return intent', () => {
      const r = classifyIntent('I want to return this product')
      expect(r.intent).toBe('return_request')
    })

    it('classifies shipping intent', () => {
      const r = classifyIntent('How long does delivery take?')
      expect(r.intent).toBe('shipping_info')
    })

    it('classifies payment issue', () => {
      const r = classifyIntent('My payment failed but money was deducted')
      expect(r.intent).toBe('payment_issue')
      expect(r.requiresHuman).toBe(true)
    })

    it('classifies complaint (needs human)', () => {
      const r = classifyIntent('This is terrible service, I have a complaint')
      expect(r.intent).toBe('complaint')
      expect(r.requiresHuman).toBe(true)
    })

    it('falls back to general query', () => {
      const r = classifyIntent('hello')
      expect(r.intent).toBe('general_query')
    })
  })

  describe('A/B Testing', () => {
    const variants = [
      { id: 'control', name: 'Control', weight: 50 },
      { id: 'variant_a', name: 'Variant A', weight: 50 },
    ]

    it('assigns deterministically (same user → same variant)', () => {
      const v1 = assignVariant('user-123', variants)
      const v2 = assignVariant('user-123', variants)
      expect(v1).toBe(v2)
    })

    it('distributes across variants', () => {
      const assignments = new Set()
      for (let i = 0; i < 100; i++) {
        assignments.add(assignVariant(`user-${i}`, variants))
      }
      expect(assignments.size).toBe(2) // Both variants assigned
    })

    it('determines winner with clear signal', () => {
      const results = [
        { variantId: 'control', impressions: 500, conversions: 25, conversionRate: 5, revenue: 10000, isWinner: false },
        { variantId: 'variant_a', impressions: 500, conversions: 50, conversionRate: 10, revenue: 20000, isWinner: false },
      ]
      const winner = determineWinner(results)
      expect(winner).not.toBeNull()
      expect(winner!.variantId).toBe('variant_a')
    })

    it('returns null when no clear winner', () => {
      const results = [
        { variantId: 'control', impressions: 50, conversions: 5, conversionRate: 10, revenue: 5000, isWinner: false },
        { variantId: 'variant_a', impressions: 50, conversions: 5, conversionRate: 10, revenue: 5000, isWinner: false },
      ]
      expect(determineWinner(results)).toBeNull()
    })
  })
})
