/**
 * Warehouse Management System — Core business logic
 * Handles bin management, pick lists, packing workflows, cycle counting, and performance metrics.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type BinType = 'storage' | 'picking' | 'packing' | 'staging' | 'returns'
export type PickListStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
export type PickItemStatus = 'pending' | 'picked' | 'short' | 'skipped'
export type PackStatus = 'pending' | 'packing' | 'packed' | 'shipped'
export type CycleCountStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

// ─── Bin Location Code ───────────────────────────────────────────────────────

/**
 * Generate a bin location code from zone, aisle, shelf, position.
 * Format: Z{zone}-A{aisle}-S{shelf}-P{position} e.g. "ZA-A03-S02-P05"
 */
export function generateBinCode(zone: string, aisle: number, shelf: number, position: number): string {
  return `Z${zone.toUpperCase()}-A${aisle.toString().padStart(2, '0')}-S${shelf.toString().padStart(2, '0')}-P${position.toString().padStart(2, '0')}`
}

/**
 * Parse a bin code into its components.
 */
export function parseBinCode(code: string): { zone: string; aisle: number; shelf: number; position: number } | null {
  const match = code.match(/^Z([A-Z]+)-A(\d+)-S(\d+)-P(\d+)$/)
  if (!match) return null
  return { zone: match[1], aisle: parseInt(match[2]), shelf: parseInt(match[3]), position: parseInt(match[4]) }
}

// ─── Pick List Optimization ──────────────────────────────────────────────────

export interface PickItem {
  orderItemId: string
  variantId: string
  productName: string
  variantLabel: string
  quantity: number
  binLocation?: string
  zone?: string
  aisle?: number
}

export interface OptimizedPickList {
  items: PickItem[]
  estimatedTime: number // minutes
  totalItems: number
  totalQuantity: number
  zones: string[]
}

/**
 * Optimize pick list by sorting items for efficient warehouse traversal.
 * Strategy: Group by zone, then sort by aisle → shelf → position (serpentine pattern).
 */
export function optimizePickList(items: PickItem[]): OptimizedPickList {
  // Sort by zone, then aisle (alternating direction for serpentine), then position
  const sorted = [...items].sort((a, b) => {
    const zoneComp = (a.zone || 'Z').localeCompare(b.zone || 'Z')
    if (zoneComp !== 0) return zoneComp

    const aisleA = a.aisle || 0
    const aisleB = b.aisle || 0
    if (aisleA !== aisleB) return aisleA - aisleB

    // Within same aisle, sort by bin location
    return (a.binLocation || '').localeCompare(b.binLocation || '')
  })

  const zones = [...new Set(sorted.map((item) => item.zone || 'Default'))]
  const totalQuantity = sorted.reduce((sum, item) => sum + item.quantity, 0)
  
  // Estimate: ~30 seconds per item pick + 15 seconds per zone transition
  const estimatedTime = Math.ceil((sorted.length * 0.5 + zones.length * 0.25))

  return {
    items: sorted,
    estimatedTime,
    totalItems: sorted.length,
    totalQuantity,
    zones,
  }
}

// ─── Packing ─────────────────────────────────────────────────────────────────

export interface PackageDetails {
  orderId: string
  weight: number // grams
  length: number // cm
  width: number // cm
  height: number // cm
  items: Array<{ variantId: string; quantity: number; verified: boolean }>
}

export interface PackValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate a packed shipment before marking as ready.
 */
export function validatePack(pack: PackageDetails): PackValidation {
  const errors: string[] = []
  const warnings: string[] = []

  if (pack.weight <= 0) errors.push('Weight must be positive')
  if (pack.weight > 30000) warnings.push('Package exceeds 30kg — verify courier limits')
  if (pack.length <= 0 || pack.width <= 0 || pack.height <= 0) errors.push('All dimensions must be positive')
  if (pack.length > 150 || pack.width > 150 || pack.height > 150) warnings.push('Oversized package — may incur extra shipping charges')

  const unverified = pack.items.filter((item) => !item.verified)
  if (unverified.length > 0) {
    errors.push(`${unverified.length} item(s) not verified via barcode scan`)
  }

  if (pack.items.length === 0) {
    errors.push('Package must contain at least one item')
  }

  return { valid: errors.length === 0, errors, warnings }
}

// ─── Shipping Label ──────────────────────────────────────────────────────────

export interface ShippingLabelData {
  orderNumber: string
  customerName: string
  address: string
  city: string
  state: string
  pincode: string
  phone: string
  weight: number
  courierName?: string
  trackingNumber?: string
  codAmount?: number
}

/**
 * Generate shipping label content (structured data for label printer).
 */
export function generateShippingLabel(data: ShippingLabelData): {
  fromAddress: string
  toAddress: string
  barcode: string
  metadata: Record<string, string>
} {
  return {
    fromAddress: 'Uyarvom Warehouse\nChennai, Tamil Nadu\nIndia - 600001',
    toAddress: `${data.customerName}\n${data.address}\n${data.city}, ${data.state} ${data.pincode}\nPh: ${data.phone}`,
    barcode: data.trackingNumber || data.orderNumber,
    metadata: {
      orderNumber: data.orderNumber,
      weight: `${data.weight}g`,
      courier: data.courierName || 'TBD',
      tracking: data.trackingNumber || 'Pending',
      cod: data.codAmount ? `₹${data.codAmount}` : 'Prepaid',
    },
  }
}

// ─── Warehouse Performance ───────────────────────────────────────────────────

export interface PerformanceMetrics {
  picksPerHour: number
  packsPerHour: number
  accuracyRate: number // percentage
  avgPickTime: number // seconds per item
  avgPackTime: number // seconds per order
  ordersProcessedToday: number
}

/**
 * Calculate warehouse performance from raw data.
 */
export function calculatePerformance(
  totalPicks: number,
  totalPacks: number,
  errors: number,
  hoursWorked: number,
  totalPickSeconds: number,
  totalPackSeconds: number,
): PerformanceMetrics {
  const totalOperations = totalPicks + totalPacks
  return {
    picksPerHour: hoursWorked > 0 ? Math.round(totalPicks / hoursWorked) : 0,
    packsPerHour: hoursWorked > 0 ? Math.round(totalPacks / hoursWorked) : 0,
    accuracyRate: totalOperations > 0 ? Math.round(((totalOperations - errors) / totalOperations) * 100 * 10) / 10 : 100,
    avgPickTime: totalPicks > 0 ? Math.round(totalPickSeconds / totalPicks) : 0,
    avgPackTime: totalPacks > 0 ? Math.round(totalPackSeconds / totalPacks) : 0,
    ordersProcessedToday: totalPacks,
  }
}

// ─── Cycle Counting ──────────────────────────────────────────────────────────

export interface CycleCountItem {
  binCode: string
  variantId: string
  expectedQty: number
  actualQty: number
}

export interface CycleCountResult {
  totalBins: number
  matchedBins: number
  discrepancies: Array<{ binCode: string; variantId: string; expected: number; actual: number; variance: number }>
  accuracyRate: number
}

/**
 * Analyze cycle count results and identify discrepancies.
 */
export function analyzeCycleCount(items: CycleCountItem[]): CycleCountResult {
  const discrepancies = items
    .filter((item) => item.expectedQty !== item.actualQty)
    .map((item) => ({
      binCode: item.binCode,
      variantId: item.variantId,
      expected: item.expectedQty,
      actual: item.actualQty,
      variance: item.actualQty - item.expectedQty,
    }))

  const matchedBins = items.length - discrepancies.length
  const accuracyRate = items.length > 0 ? Math.round((matchedBins / items.length) * 100 * 10) / 10 : 100

  return {
    totalBins: items.length,
    matchedBins,
    discrepancies,
    accuracyRate,
  }
}

// ─── Pick List Number Generation ─────────────────────────────────────────────

export function generatePickListNumber(): string {
  return `PL-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`
}
