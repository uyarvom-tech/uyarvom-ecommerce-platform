/**
 * AI Features — Core business logic
 * Demand forecasting, inventory optimization, dynamic pricing, recommendations,
 * churn prediction, fraud detection, procurement suggestions, and chatbot.
 */

// ─── Demand Forecasting ──────────────────────────────────────────────────────

export interface DemandForecast {
  variantId: string
  productName: string
  currentStock: number
  predictedDailySales: number
  predictedWeeklySales: number
  confidence: number // 0-1
  trend: 'rising' | 'stable' | 'declining'
  seasonalFactor: number // multiplier
}

/**
 * Predict future sales using weighted moving average with trend detection.
 * Uses recent data (last 7 days weighted higher) vs older data (8-30 days).
 */
export function forecastDemand(
  recentSales: number[], // last 7 days (index 0 = most recent)
  olderSales: number[], // previous 8-30 days
  currentStock: number,
  seasonalMultiplier: number = 1.0,
): Omit<DemandForecast, 'variantId' | 'productName'> {
  const recentAvg = recentSales.length > 0
    ? recentSales.reduce((s, v) => s + v, 0) / recentSales.length
    : 0
  const olderAvg = olderSales.length > 0
    ? olderSales.reduce((s, v) => s + v, 0) / olderSales.length
    : 0

  // Weighted: 70% recent, 30% older
  const baseDaily = recentAvg * 0.7 + olderAvg * 0.3
  const predictedDailySales = Math.round(baseDaily * seasonalMultiplier * 100) / 100

  // Trend detection
  let trend: DemandForecast['trend'] = 'stable'
  if (recentAvg > olderAvg * 1.2) trend = 'rising'
  else if (recentAvg < olderAvg * 0.8) trend = 'declining'

  // Confidence based on data availability
  const dataPoints = recentSales.length + olderSales.length
  const confidence = Math.min(1, dataPoints / 30) // Full confidence at 30 days

  return {
    currentStock,
    predictedDailySales,
    predictedWeeklySales: Math.round(predictedDailySales * 7 * 100) / 100,
    confidence,
    trend,
    seasonalFactor: seasonalMultiplier,
  }
}

// ─── Inventory Optimization ──────────────────────────────────────────────────

export interface ReorderRecommendation {
  variantId: string
  productName: string
  currentStock: number
  reorderPoint: number
  economicOrderQuantity: number
  daysUntilStockout: number
  urgency: 'critical' | 'soon' | 'planned' | 'ok'
}

/**
 * Calculate Economic Order Quantity (EOQ) using Wilson formula.
 * EOQ = sqrt(2 × D × S / H)
 * D = Annual demand, S = Ordering cost, H = Holding cost per unit
 */
export function calculateEOQ(annualDemand: number, orderingCost: number = 500, holdingCostPerUnit: number = 50): number {
  if (annualDemand <= 0) return 0
  const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCostPerUnit)
  return Math.max(1, Math.ceil(eoq))
}

/**
 * Determine reorder urgency based on days until stockout.
 */
export function getReorderUrgency(daysUntilStockout: number): ReorderRecommendation['urgency'] {
  if (daysUntilStockout <= 0) return 'critical'
  if (daysUntilStockout <= 7) return 'soon'
  if (daysUntilStockout <= 30) return 'planned'
  return 'ok'
}

// ─── Dynamic Pricing ─────────────────────────────────────────────────────────

export interface PricingSuggestion {
  currentPrice: number
  suggestedPrice: number
  changePercent: number
  reason: string
  confidence: number
}

/**
 * Suggest dynamic price based on demand, stock, and competition.
 * Rules:
 * - High demand + low stock → increase price (up to 20%)
 * - Low demand + high stock → decrease price (up to 15%)
 * - Moderate → keep stable
 */
export function suggestDynamicPrice(
  currentPrice: number,
  demandTrend: 'rising' | 'stable' | 'declining',
  stockDaysRemaining: number,
  competitorAvgPrice?: number,
): PricingSuggestion {
  let multiplier = 1.0
  let reason = 'Price is optimal'

  // Demand-based adjustment
  if (demandTrend === 'rising' && stockDaysRemaining < 14) {
    multiplier = 1.1 + Math.min(0.1, (14 - stockDaysRemaining) / 140) // Up to +20%
    reason = 'High demand with limited stock'
  } else if (demandTrend === 'declining' && stockDaysRemaining > 60) {
    multiplier = 0.9 - Math.min(0.05, (stockDaysRemaining - 60) / 1200) // Down to -15%
    reason = 'Low demand with excess stock'
  } else if (demandTrend === 'rising') {
    multiplier = 1.05
    reason = 'Rising demand'
  } else if (demandTrend === 'declining') {
    multiplier = 0.95
    reason = 'Declining demand'
  }

  // Competitor price influence (if available)
  if (competitorAvgPrice && competitorAvgPrice > 0) {
    const competitorRatio = competitorAvgPrice / currentPrice
    if (competitorRatio > 1.2) {
      multiplier = Math.min(multiplier * 1.05, 1.2)
      reason += ' + priced below competition'
    } else if (competitorRatio < 0.8) {
      multiplier = Math.max(multiplier * 0.95, 0.85)
      reason += ' + priced above competition'
    }
  }

  const suggestedPrice = Math.round(currentPrice * multiplier)
  const changePercent = Math.round((multiplier - 1) * 100 * 10) / 10

  return {
    currentPrice,
    suggestedPrice,
    changePercent,
    reason,
    confidence: Math.abs(changePercent) > 5 ? 0.7 : 0.9,
  }
}

// ─── Product Recommendations ─────────────────────────────────────────────────

export type RecommendationType = 'collaborative' | 'content_based' | 'trending' | 'personalized'

export interface ProductRecommendation {
  productId: string
  score: number // 0-100
  type: RecommendationType
  reason: string
}

/**
 * Content-based recommendation scoring.
 * Scores products based on category match, price range, and popularity.
 */
export function scoreContentBased(
  sourceCategory: string,
  targetCategory: string,
  sourcePriceRange: [number, number],
  targetPrice: number,
  targetPopularity: number, // 0-100 based on order count
): number {
  let score = 0

  // Category match
  if (sourceCategory === targetCategory) score += 40
  else score += 10

  // Price range affinity
  const [minPrice, maxPrice] = sourcePriceRange
  if (targetPrice >= minPrice && targetPrice <= maxPrice) score += 30
  else if (targetPrice >= minPrice * 0.5 && targetPrice <= maxPrice * 2) score += 15

  // Popularity boost
  score += Math.min(30, targetPopularity * 0.3)

  return Math.min(100, Math.round(score))
}

/**
 * Collaborative filtering: score based on co-purchase frequency.
 */
export function scoreCollaborative(coPurchaseCount: number, totalOrders: number): number {
  if (totalOrders === 0) return 0
  const rate = coPurchaseCount / totalOrders
  return Math.min(100, Math.round(rate * 500)) // Scale up small rates
}

// ─── Customer Churn Prediction ───────────────────────────────────────────────

export interface ChurnPrediction {
  userId: string
  churnProbability: number // 0-1
  riskLevel: 'high' | 'medium' | 'low'
  signals: string[]
  suggestedAction: string
}

/**
 * Predict churn probability based on behavioral signals.
 */
export function predictChurn(
  daysSinceLastOrder: number,
  orderFrequencyDecline: number, // percentage decline vs previous period
  avgRating: number, // 1-5, 0 if no reviews
  supportTicketsOpen: number,
  cartAbandoned: boolean,
): Omit<ChurnPrediction, 'userId'> {
  let probability = 0
  const signals: string[] = []

  // Recency
  if (daysSinceLastOrder > 90) { probability += 0.3; signals.push('No order in 90+ days') }
  else if (daysSinceLastOrder > 60) { probability += 0.15; signals.push('No order in 60+ days') }

  // Frequency decline
  if (orderFrequencyDecline > 50) { probability += 0.25; signals.push('Order frequency dropped >50%') }
  else if (orderFrequencyDecline > 25) { probability += 0.1; signals.push('Order frequency declining') }

  // Low satisfaction
  if (avgRating > 0 && avgRating < 3) { probability += 0.2; signals.push('Low review ratings') }

  // Support issues
  if (supportTicketsOpen > 2) { probability += 0.15; signals.push('Multiple open support tickets') }

  // Cart abandonment
  if (cartAbandoned) { probability += 0.1; signals.push('Recent cart abandonment') }

  probability = Math.min(1, probability)

  const riskLevel: ChurnPrediction['riskLevel'] =
    probability >= 0.6 ? 'high' : probability >= 0.3 ? 'medium' : 'low'

  const suggestedAction =
    riskLevel === 'high' ? 'Send win-back offer with 20% discount' :
    riskLevel === 'medium' ? 'Send personalized product recommendations' :
    'Continue regular engagement'

  return { churnProbability: Math.round(probability * 100) / 100, riskLevel, signals, suggestedAction }
}

// ─── Fraud Detection ─────────────────────────────────────────────────────────

export interface FraudSignal {
  orderId: string
  riskScore: number // 0-100
  riskLevel: 'high' | 'medium' | 'low'
  flags: string[]
  recommendation: 'block' | 'review' | 'allow'
}

/**
 * Score fraud risk for an order based on behavioral signals.
 */
export function scoreFraudRisk(
  orderTotal: number,
  avgOrderValue: number,
  isNewCustomer: boolean,
  addressMismatch: boolean,
  multipleFailedPayments: number,
  unusualTime: boolean, // Order placed at unusual hour
  highValueItems: boolean,
): Omit<FraudSignal, 'orderId'> {
  let riskScore = 0
  const flags: string[] = []

  // Unusually high order
  if (avgOrderValue > 0 && orderTotal > avgOrderValue * 5) {
    riskScore += 25; flags.push('Order 5x above customer average')
  } else if (avgOrderValue > 0 && orderTotal > avgOrderValue * 3) {
    riskScore += 15; flags.push('Order 3x above customer average')
  }

  if (isNewCustomer && orderTotal > 5000) { riskScore += 20; flags.push('High-value order from new customer') }
  if (addressMismatch) { riskScore += 20; flags.push('Billing/shipping address mismatch') }
  if (multipleFailedPayments >= 3) { riskScore += 25; flags.push('3+ failed payment attempts') }
  else if (multipleFailedPayments >= 2) { riskScore += 10; flags.push('Multiple failed payments') }
  if (unusualTime) { riskScore += 10; flags.push('Order placed at unusual hour') }
  if (highValueItems) { riskScore += 10; flags.push('Contains high-value items') }

  riskScore = Math.min(100, riskScore)
  const riskLevel: FraudSignal['riskLevel'] = riskScore >= 60 ? 'high' : riskScore >= 30 ? 'medium' : 'low'
  const recommendation: FraudSignal['recommendation'] = riskScore >= 70 ? 'block' : riskScore >= 40 ? 'review' : 'allow'

  return { riskScore, riskLevel, flags, recommendation }
}

// ─── Automated Procurement Suggestions ───────────────────────────────────────

export interface ProcurementSuggestion {
  variantId: string
  productName: string
  currentStock: number
  dailySalesRate: number
  daysUntilStockout: number
  suggestedOrderQty: number
  estimatedCost: number
  preferredVendor?: string
  urgency: 'immediate' | 'this_week' | 'next_week' | 'next_month'
}

/**
 * Generate procurement suggestions based on stock levels and sales velocity.
 */
export function generateProcurementSuggestion(
  currentStock: number,
  dailySalesRate: number,
  leadTimeDays: number,
  buyingPrice: number,
  moq: number = 1,
): Omit<ProcurementSuggestion, 'variantId' | 'productName' | 'preferredVendor'> {
  const daysUntilStockout = dailySalesRate > 0 ? Math.floor(currentStock / dailySalesRate) : Infinity
  const safetyStock = Math.ceil(dailySalesRate * (leadTimeDays + 7)) // Lead time + 7 day buffer
  const suggestedOrderQty = Math.max(moq, Math.ceil(dailySalesRate * 30)) // 30 days coverage
  const roundedQty = Math.ceil(suggestedOrderQty / moq) * moq
  const estimatedCost = roundedQty * buyingPrice

  let urgency: ProcurementSuggestion['urgency']
  if (daysUntilStockout <= leadTimeDays) urgency = 'immediate'
  else if (daysUntilStockout <= leadTimeDays + 7) urgency = 'this_week'
  else if (daysUntilStockout <= leadTimeDays + 14) urgency = 'next_week'
  else urgency = 'next_month'

  return { currentStock, dailySalesRate, daysUntilStockout, suggestedOrderQty: roundedQty, estimatedCost, urgency }
}

// ─── AI Chatbot Intent Detection ─────────────────────────────────────────────

export type ChatIntent = 'order_status' | 'product_info' | 'return_request' | 'shipping_info' | 'payment_issue' | 'general_query' | 'complaint'

export interface ChatResponse {
  intent: ChatIntent
  confidence: number
  suggestedResponse: string
  requiresHuman: boolean
}

/**
 * Simple keyword-based intent classification for customer support chatbot.
 * In production, this would use an LLM or trained classifier.
 */
export function classifyIntent(message: string): ChatResponse {
  const lower = message.toLowerCase()

  if (/order.*(status|track|where|when|delivery)|where.*order/.test(lower)) {
    return { intent: 'order_status', confidence: 0.9, suggestedResponse: 'I can help you track your order. Please provide your order number.', requiresHuman: false }
  }
  if (/return|refund|exchange|replace/.test(lower)) {
    return { intent: 'return_request', confidence: 0.85, suggestedResponse: 'I can help with returns. Our return window is 7 days from delivery. Would you like to initiate a return?', requiresHuman: false }
  }
  if (/ship|deliver|courier|tracking/.test(lower)) {
    return { intent: 'shipping_info', confidence: 0.85, suggestedResponse: 'We ship across India. Standard delivery takes 3-7 business days. Would you like to check a specific order?', requiresHuman: false }
  }
  if (/pay|payment|razorpay|upi|card|failed|charged/.test(lower)) {
    return { intent: 'payment_issue', confidence: 0.8, suggestedResponse: 'For payment issues, please share your order number. If payment was deducted but order not confirmed, it will be auto-refunded in 5-7 days.', requiresHuman: true }
  }
  if (/product|price|stock|available|size|color|material/.test(lower)) {
    return { intent: 'product_info', confidence: 0.75, suggestedResponse: 'I can help you find product information. Which product are you interested in?', requiresHuman: false }
  }
  if (/complaint|bad|worst|terrible|issue|problem|angry/.test(lower)) {
    return { intent: 'complaint', confidence: 0.8, suggestedResponse: 'I\'m sorry to hear about your experience. Let me connect you with our support team for immediate assistance.', requiresHuman: true }
  }

  return { intent: 'general_query', confidence: 0.5, suggestedResponse: 'How can I help you today? I can assist with orders, products, shipping, returns, or payments.', requiresHuman: false }
}

// ─── A/B Testing Framework ───────────────────────────────────────────────────

export interface ABTest {
  id: string
  name: string
  variants: Array<{ id: string; name: string; weight: number }> // weight as percentage
  status: 'draft' | 'running' | 'completed'
  startDate: Date
  endDate?: Date
}

export interface ABTestResult {
  variantId: string
  impressions: number
  conversions: number
  conversionRate: number
  revenue: number
  isWinner: boolean
}

/**
 * Assign a user to an A/B test variant based on weights.
 */
export function assignVariant(userId: string, variants: ABTest['variants']): string {
  // Deterministic assignment based on user ID hash
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0
  }
  const bucket = Math.abs(hash) % 100

  let cumulative = 0
  for (const variant of variants) {
    cumulative += variant.weight
    if (bucket < cumulative) return variant.id
  }
  return variants[variants.length - 1].id
}

/**
 * Determine winner of an A/B test using statistical significance (simplified).
 */
export function determineWinner(results: ABTestResult[]): ABTestResult | null {
  if (results.length < 2) return null

  const sorted = [...results].sort((a, b) => b.conversionRate - a.conversionRate)
  const best = sorted[0]
  const secondBest = sorted[1]

  // Simple rule: winner needs at least 5% better conversion rate and 100+ impressions
  if (best.impressions >= 100 && best.conversionRate > secondBest.conversionRate * 1.05) {
    return { ...best, isWinner: true }
  }
  return null // No clear winner yet
}
