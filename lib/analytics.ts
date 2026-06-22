/**
 * Analytics & Dashboards — Core business logic
 * Revenue trends, margins, CLV, churn, NPS, data aggregation, and report export.
 */

// ─── Revenue Analytics ───────────────────────────────────────────────────────

export interface RevenueTrend {
  period: string // date or label
  revenue: number
  orders: number
  avgOrderValue: number
}

/**
 * Group orders into time buckets for trend analysis.
 */
export function aggregateRevenueTrends(
  orders: Array<{ total: number; createdAt: Date }>,
  groupBy: 'daily' | 'weekly' | 'monthly' = 'daily',
): RevenueTrend[] {
  const buckets = new Map<string, { revenue: number; orders: number }>()

  for (const order of orders) {
    const date = new Date(order.createdAt)
    let key: string

    if (groupBy === 'daily') {
      key = date.toISOString().split('T')[0]
    } else if (groupBy === 'weekly') {
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      key = `W${weekStart.toISOString().split('T')[0]}`
    } else {
      key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
    }

    const existing = buckets.get(key) || { revenue: 0, orders: 0 }
    existing.revenue += order.total
    existing.orders += 1
    buckets.set(key, existing)
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, data]) => ({
      period,
      revenue: Math.round(data.revenue),
      orders: data.orders,
      avgOrderValue: data.orders > 0 ? Math.round(data.revenue / data.orders) : 0,
    }))
}

/**
 * Calculate Year-over-Year growth.
 */
export function calculateYoYGrowth(currentPeriodRevenue: number, previousPeriodRevenue: number): number {
  if (previousPeriodRevenue === 0) return currentPeriodRevenue > 0 ? 100 : 0
  return Math.round(((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 * 10) / 10
}

// ─── Margin Tracking ─────────────────────────────────────────────────────────

export interface MarginData {
  revenue: number
  cogs: number // Cost of goods sold
  grossProfit: number
  grossMargin: number // percentage
  operatingExpenses: number
  netProfit: number
  netMargin: number
}

export function calculateMargins(revenue: number, cogs: number, operatingExpenses: number = 0): MarginData {
  const grossProfit = revenue - cogs
  const grossMargin = revenue > 0 ? Math.round((grossProfit / revenue) * 100 * 10) / 10 : 0
  const netProfit = grossProfit - operatingExpenses
  const netMargin = revenue > 0 ? Math.round((netProfit / revenue) * 100 * 10) / 10 : 0

  return { revenue, cogs, grossProfit, grossMargin, operatingExpenses, netProfit, netMargin }
}

// ─── Inventory Value ─────────────────────────────────────────────────────────

export interface InventoryValue {
  totalUnits: number
  totalCostValue: number // At buying price
  totalRetailValue: number // At selling price
  potentialProfit: number
  avgCostPerUnit: number
}

export function calculateInventoryValue(
  items: Array<{ stock: number; buyingPrice: number; sellingPrice: number }>
): InventoryValue {
  let totalUnits = 0
  let totalCostValue = 0
  let totalRetailValue = 0

  for (const item of items) {
    totalUnits += item.stock
    totalCostValue += item.stock * item.buyingPrice
    totalRetailValue += item.stock * item.sellingPrice
  }

  return {
    totalUnits,
    totalCostValue: Math.round(totalCostValue),
    totalRetailValue: Math.round(totalRetailValue),
    potentialProfit: Math.round(totalRetailValue - totalCostValue),
    avgCostPerUnit: totalUnits > 0 ? Math.round(totalCostValue / totalUnits) : 0,
  }
}

// ─── Customer Analytics ──────────────────────────────────────────────────────

export interface CustomerMetrics {
  totalCustomers: number
  newCustomers: number // in period
  repeatPurchaseRate: number
  churnRate: number
  avgCLV: number
}

/**
 * Calculate repeat purchase rate.
 */
export function calculateRepeatRate(totalCustomers: number, repeatCustomers: number): number {
  if (totalCustomers === 0) return 0
  return Math.round((repeatCustomers / totalCustomers) * 100 * 10) / 10
}

/**
 * Calculate churn rate (customers who haven't ordered in X days).
 */
export function calculateChurnRate(totalActive: number, churned: number): number {
  if (totalActive === 0) return 0
  return Math.round((churned / totalActive) * 100 * 10) / 10
}

/**
 * Simple NPS calculation from ratings.
 * Promoters (9-10): score +
 * Detractors (1-6): score -
 * Passives (7-8): neutral
 * NPS = % Promoters - % Detractors
 */
export function calculateNPS(ratings: number[]): number {
  if (ratings.length === 0) return 0
  // Map 1-5 star ratings to NPS scale: 5=promoter, 4=passive, 1-3=detractor
  const promoters = ratings.filter(r => r >= 5).length
  const detractors = ratings.filter(r => r <= 3).length
  const total = ratings.length

  return Math.round(((promoters - detractors) / total) * 100)
}

// ─── Warehouse Productivity ──────────────────────────────────────────────────

export interface WarehouseMetrics {
  ordersProcessed: number
  avgFulfillmentHours: number
  pickAccuracy: number
  packAccuracy: number
  throughput: number // orders per hour
}

export function calculateWarehouseMetrics(
  ordersProcessed: number,
  totalHours: number,
  pickErrors: number,
  totalPicks: number,
  packErrors: number,
  totalPacks: number,
): WarehouseMetrics {
  return {
    ordersProcessed,
    avgFulfillmentHours: ordersProcessed > 0 ? Math.round((totalHours / ordersProcessed) * 10) / 10 : 0,
    pickAccuracy: totalPicks > 0 ? Math.round(((totalPicks - pickErrors) / totalPicks) * 100 * 10) / 10 : 100,
    packAccuracy: totalPacks > 0 ? Math.round(((totalPacks - packErrors) / totalPacks) * 100 * 10) / 10 : 100,
    throughput: totalHours > 0 ? Math.round((ordersProcessed / totalHours) * 10) / 10 : 0,
  }
}

// ─── Supplier Scorecards ─────────────────────────────────────────────────────

export interface SupplierScorecard {
  vendorId: string
  vendorName: string
  onTimeRate: number
  qualityRate: number
  avgLeadDays: number
  totalOrders: number
  overallScore: number // 0-100
}

export function calculateSupplierScore(onTimeRate: number, qualityRate: number): number {
  return Math.round((onTimeRate * 0.6 + qualityRate * 0.4))
}

// ─── Report Export ───────────────────────────────────────────────────────────

export interface ReportConfig {
  type: 'revenue' | 'inventory' | 'customers' | 'orders' | 'suppliers'
  period: { from: Date; to: Date }
  format: 'csv' | 'json'
  includeCharts: boolean
}

/**
 * Format data as CSV string for export.
 */
export function toCSV(headers: string[], rows: any[][]): string {
  const headerLine = headers.join(',')
  const dataLines = rows.map(row =>
    row.map(cell => {
      const str = String(cell ?? '')
      return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
    }).join(',')
  )
  return [headerLine, ...dataLines].join('\n')
}
