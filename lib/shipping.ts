/**
 * Shipping & Logistics — Core business logic
 * Handles carrier management, rate calculation, shipment tracking, NDR, and delivery slots.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type ShipmentStatus = 'created' | 'pickup_scheduled' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned_to_origin'
export type NDRReason = 'customer_unavailable' | 'wrong_address' | 'refused' | 'damaged' | 'other'

export interface Carrier {
  id: string
  name: string
  code: string // delhivery, bluedart, fedex, dtdc
  isActive: boolean
  baseRate: number // per kg base rate
  perKgRate: number
  minWeight: number // grams
  maxWeight: number // grams
  codAvailable: boolean
  codCharge: number
  estimatedDays: { local: number; regional: number; national: number }
  serviceablePincodes?: string[] // empty = all India
}

export const DEFAULT_CARRIERS: Omit<Carrier, 'id'>[] = [
  {
    name: 'Delhivery', code: 'delhivery', isActive: true,
    baseRate: 40, perKgRate: 20, minWeight: 100, maxWeight: 30000,
    codAvailable: true, codCharge: 30,
    estimatedDays: { local: 2, regional: 4, national: 7 },
  },
  {
    name: 'Blue Dart', code: 'bluedart', isActive: true,
    baseRate: 60, perKgRate: 30, minWeight: 100, maxWeight: 25000,
    codAvailable: true, codCharge: 50,
    estimatedDays: { local: 1, regional: 3, national: 5 },
  },
  {
    name: 'DTDC', code: 'dtdc', isActive: true,
    baseRate: 35, perKgRate: 15, minWeight: 100, maxWeight: 30000,
    codAvailable: true, codCharge: 25,
    estimatedDays: { local: 3, regional: 5, national: 8 },
  },
  {
    name: 'FedEx', code: 'fedex', isActive: true,
    baseRate: 100, perKgRate: 50, minWeight: 500, maxWeight: 50000,
    codAvailable: false, codCharge: 0,
    estimatedDays: { local: 1, regional: 2, national: 4 },
  },
]

// ─── Rate Calculation ────────────────────────────────────────────────────────

export interface ShippingRate {
  carrierCode: string
  carrierName: string
  baseCharge: number
  weightCharge: number
  codCharge: number
  totalCharge: number
  estimatedDays: number
  available: boolean
  reason?: string
}

export type DeliveryZone = 'local' | 'regional' | 'national'

/**
 * Determine delivery zone from origin and destination states.
 */
export function getDeliveryZone(originState: string, destState: string, originCity?: string, destCity?: string): DeliveryZone {
  if (originState === destState) {
    if (originCity && destCity && originCity === destCity) return 'local'
    return 'regional'
  }
  return 'national'
}

/**
 * Calculate shipping rate for a carrier.
 */
export function calculateCarrierRate(
  carrier: Omit<Carrier, 'id'>,
  weightGrams: number,
  zone: DeliveryZone,
  isCOD: boolean = false,
): ShippingRate {
  // Check weight limits
  if (weightGrams < carrier.minWeight) {
    return { carrierCode: carrier.code, carrierName: carrier.name, baseCharge: 0, weightCharge: 0, codCharge: 0, totalCharge: 0, estimatedDays: 0, available: false, reason: `Minimum weight: ${carrier.minWeight}g` }
  }
  if (weightGrams > carrier.maxWeight) {
    return { carrierCode: carrier.code, carrierName: carrier.name, baseCharge: 0, weightCharge: 0, codCharge: 0, totalCharge: 0, estimatedDays: 0, available: false, reason: `Maximum weight: ${carrier.maxWeight / 1000}kg` }
  }

  // COD check
  if (isCOD && !carrier.codAvailable) {
    return { carrierCode: carrier.code, carrierName: carrier.name, baseCharge: 0, weightCharge: 0, codCharge: 0, totalCharge: 0, estimatedDays: 0, available: false, reason: 'COD not available' }
  }

  const weightKg = Math.ceil(weightGrams / 500) * 0.5 // Round up to nearest 500g
  const weightCharge = Math.max(0, (weightKg - 0.5)) * carrier.perKgRate // First 500g included in base
  const codCharge = isCOD ? carrier.codCharge : 0
  const totalCharge = carrier.baseRate + weightCharge + codCharge
  const estimatedDays = carrier.estimatedDays[zone]

  return {
    carrierCode: carrier.code,
    carrierName: carrier.name,
    baseCharge: carrier.baseRate,
    weightCharge: Math.round(weightCharge * 100) / 100,
    codCharge,
    totalCharge: Math.round(totalCharge * 100) / 100,
    estimatedDays,
    available: true,
  }
}

/**
 * Get all available rates for a shipment, sorted by cheapest first.
 */
export function getAllRates(
  carriers: Omit<Carrier, 'id'>[],
  weightGrams: number,
  zone: DeliveryZone,
  isCOD: boolean = false,
): ShippingRate[] {
  return carriers
    .filter((c) => c.isActive)
    .map((c) => calculateCarrierRate(c, weightGrams, zone, isCOD))
    .sort((a, b) => {
      if (a.available && !b.available) return -1
      if (!a.available && b.available) return 1
      return a.totalCharge - b.totalCharge
    })
}

/**
 * Select optimal carrier (cheapest available).
 */
export function selectOptimalCarrier(
  carriers: Omit<Carrier, 'id'>[],
  weightGrams: number,
  zone: DeliveryZone,
  isCOD: boolean = false,
): ShippingRate | null {
  const rates = getAllRates(carriers, weightGrams, zone, isCOD)
  return rates.find((r) => r.available) || null
}

// ─── Tracking Events ─────────────────────────────────────────────────────────

export interface TrackingEvent {
  status: ShipmentStatus
  timestamp: Date
  location?: string
  description: string
}

export const SHIPMENT_STATUS_FLOW: ShipmentStatus[] = [
  'created', 'pickup_scheduled', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered',
]

/**
 * Validate tracking status transition.
 */
export function isValidTrackingTransition(from: ShipmentStatus, to: ShipmentStatus): boolean {
  if (from === to) return true
  if (to === 'failed' || to === 'returned_to_origin') return true // Can fail from any state
  const fromIdx = SHIPMENT_STATUS_FLOW.indexOf(from)
  const toIdx = SHIPMENT_STATUS_FLOW.indexOf(to)
  if (fromIdx === -1 || toIdx === -1) return false
  return toIdx > fromIdx
}

// ─── NDR (Non-Delivery Report) ───────────────────────────────────────────────

export interface NDRAction {
  action: 'reattempt' | 'return_to_origin' | 'update_address' | 'cancel'
  newAddress?: string
  reattemptDate?: Date
}

export const NDR_REASONS: { value: NDRReason; label: string }[] = [
  { value: 'customer_unavailable', label: 'Customer Unavailable' },
  { value: 'wrong_address', label: 'Wrong/Incomplete Address' },
  { value: 'refused', label: 'Delivery Refused' },
  { value: 'damaged', label: 'Package Damaged in Transit' },
  { value: 'other', label: 'Other' },
]

// ─── Delivery Slots ──────────────────────────────────────────────────────────

export interface DeliverySlot {
  date: string // YYYY-MM-DD
  timeStart: string // HH:MM
  timeEnd: string // HH:MM
  available: boolean
  maxOrders: number
  currentOrders: number
}

/**
 * Generate available delivery slots for the next N days.
 */
export function generateDeliverySlots(days: number = 7, maxOrdersPerSlot: number = 20): DeliverySlot[] {
  const slots: DeliverySlot[] = []
  const today = new Date()

  for (let d = 1; d <= days; d++) {
    const date = new Date(today)
    date.setDate(date.getDate() + d)
    const dateStr = date.toISOString().split('T')[0]

    // Morning slot
    slots.push({ date: dateStr, timeStart: '09:00', timeEnd: '12:00', available: true, maxOrders: maxOrdersPerSlot, currentOrders: 0 })
    // Afternoon slot
    slots.push({ date: dateStr, timeStart: '14:00', timeEnd: '17:00', available: true, maxOrders: maxOrdersPerSlot, currentOrders: 0 })
    // Evening slot
    slots.push({ date: dateStr, timeStart: '18:00', timeEnd: '21:00', available: true, maxOrders: maxOrdersPerSlot, currentOrders: 0 })
  }

  return slots
}

// ─── AWB / Tracking Number ───────────────────────────────────────────────────

export function generateAWB(carrierCode: string): string {
  const prefix = carrierCode.slice(0, 3).toUpperCase()
  const num = Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${prefix}${num}`
}
