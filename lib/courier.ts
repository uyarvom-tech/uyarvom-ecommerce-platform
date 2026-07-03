/**
 * Courier Portal & Delivery Management — Core business logic
 * Status updates, proof of delivery, GPS tracking, assignment, performance.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type CourierDeliveryStatus = 'assigned' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'rescheduled'

export type DeliveryFailureReason = 'customer_unavailable' | 'wrong_address' | 'refused_delivery' | 'damaged_package' | 'access_restricted' | 'other'

export const DELIVERY_STATUSES: { value: CourierDeliveryStatus; label: string; description: string }[] = [
  { value: 'assigned', label: 'Assigned', description: 'Order assigned to courier' },
  { value: 'picked_up', label: 'Picked Up', description: 'Package collected from warehouse' },
  { value: 'in_transit', label: 'In Transit', description: 'Package on the way' },
  { value: 'out_for_delivery', label: 'Out for Delivery', description: 'Near customer location' },
  { value: 'delivered', label: 'Delivered', description: 'Successfully delivered' },
  { value: 'failed', label: 'Failed', description: 'Delivery attempt failed' },
  { value: 'rescheduled', label: 'Rescheduled', description: 'New delivery date set' },
]

export const FAILURE_REASONS: { value: DeliveryFailureReason; label: string }[] = [
  { value: 'customer_unavailable', label: 'Customer Not Available' },
  { value: 'wrong_address', label: 'Wrong / Incomplete Address' },
  { value: 'refused_delivery', label: 'Customer Refused Delivery' },
  { value: 'damaged_package', label: 'Package Damaged in Transit' },
  { value: 'access_restricted', label: 'Cannot Access Location' },
  { value: 'other', label: 'Other Reason' },
]

// ─── Status Transitions ──────────────────────────────────────────────────────

const COURIER_STATUS_TRANSITIONS: Record<CourierDeliveryStatus, CourierDeliveryStatus[]> = {
  assigned: ['picked_up'],
  picked_up: ['in_transit'],
  in_transit: ['out_for_delivery', 'failed'],
  out_for_delivery: ['delivered', 'failed'],
  delivered: [], // Terminal
  failed: ['rescheduled', 'picked_up'], // Can retry
  rescheduled: ['picked_up'],
}

export function isValidCourierTransition(from: CourierDeliveryStatus, to: CourierDeliveryStatus): boolean {
  if (from === to) return true
  return COURIER_STATUS_TRANSITIONS[from]?.includes(to) ?? false
}

export function getNextCourierStatuses(current: CourierDeliveryStatus): CourierDeliveryStatus[] {
  return COURIER_STATUS_TRANSITIONS[current] || []
}

// ─── Status Update Validation ────────────────────────────────────────────────

export interface CourierStatusUpdate {
  orderId: string
  courierId: string
  status: CourierDeliveryStatus
  notes?: string
  failureReason?: DeliveryFailureReason
  proofOfDeliveryUrl?: string
  rescheduleDate?: string
  location?: { lat: number; lng: number }
}

export function validateStatusUpdate(update: CourierStatusUpdate, currentStatus: CourierDeliveryStatus): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!update.orderId) errors.push('Order ID is required')
  if (!update.courierId) errors.push('Courier ID is required')
  if (!update.status) errors.push('Status is required')

  if (!isValidCourierTransition(currentStatus, update.status)) {
    errors.push(`Cannot transition from "${currentStatus}" to "${update.status}"`)
  }

  if (update.status === 'delivered' && !update.proofOfDeliveryUrl) {
    errors.push('Proof of delivery (photo) is required for delivered status')
  }

  if (update.status === 'failed' && !update.failureReason) {
    errors.push('Failure reason is required when marking as failed')
  }

  if (update.status === 'rescheduled' && !update.rescheduleDate) {
    errors.push('Reschedule date is required')
  }

  if (update.rescheduleDate) {
    const date = new Date(update.rescheduleDate)
    if (isNaN(date.getTime())) errors.push('Invalid reschedule date')
    if (date < new Date()) errors.push('Reschedule date must be in the future')
  }

  return { valid: errors.length === 0, errors }
}

// ─── Courier Assignment ──────────────────────────────────────────────────────

export interface CourierProfile {
  id: string
  name: string
  email: string
  phone: string
  vehicleType: string
  serviceArea: string
  isActive: boolean
  activeOrders: number
  completedOrders: number
}

/**
 * Score couriers for assignment (lower score = better choice).
 * Factors: active orders (less is better), service area match.
 */
export function scoreCourierForAssignment(
  courier: CourierProfile,
  deliveryArea: string,
): number {
  let score = courier.activeOrders * 10 // Penalize busy couriers

  // Bonus for matching service area
  if (courier.serviceArea.toLowerCase() === deliveryArea.toLowerCase()) {
    score -= 20
  }

  // Penalize inactive
  if (!courier.isActive) score += 1000

  return score
}

/**
 * Select the best courier from a list for a given delivery area.
 */
export function selectBestCourier(couriers: CourierProfile[], deliveryArea: string): CourierProfile | null {
  const active = couriers.filter(c => c.isActive)
  if (active.length === 0) return null

  const scored = active.map(c => ({ courier: c, score: scoreCourierForAssignment(c, deliveryArea) }))
  scored.sort((a, b) => a.score - b.score)

  return scored[0].courier
}

// ─── Performance Metrics ─────────────────────────────────────────────────────

export interface CourierPerformance {
  totalDeliveries: number
  successfulDeliveries: number
  failedDeliveries: number
  successRate: number
  avgDeliveryTimeHours: number
  onTimeRate: number
  rating: 'excellent' | 'good' | 'average' | 'poor'
}

export function calculateCourierPerformance(
  totalDeliveries: number,
  successful: number,
  failed: number,
  totalDeliveryHours: number,
  onTimeCount: number,
): CourierPerformance {
  const successRate = totalDeliveries > 0 ? Math.round((successful / totalDeliveries) * 100) : 0
  const avgDeliveryTimeHours = successful > 0 ? Math.round((totalDeliveryHours / successful) * 10) / 10 : 0
  const onTimeRate = successful > 0 ? Math.round((onTimeCount / successful) * 100) : 0

  let rating: CourierPerformance['rating']
  if (successRate >= 95 && onTimeRate >= 90) rating = 'excellent'
  else if (successRate >= 85 && onTimeRate >= 75) rating = 'good'
  else if (successRate >= 70) rating = 'average'
  else rating = 'poor'

  return { totalDeliveries, successfulDeliveries: successful, failedDeliveries: failed, successRate, avgDeliveryTimeHours, onTimeRate, rating }
}

// ─── GPS / Location ──────────────────────────────────────────────────────────

export interface GPSLocation {
  lat: number
  lng: number
  timestamp: Date
  accuracy?: number
}

/**
 * Calculate distance between two GPS points (Haversine formula) in km.
 */
export function calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
  const R = 6371 // Earth radius in km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180
  const dLng = (point2.lng - point1.lng) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c * 100) / 100
}

/**
 * Check if courier is near the delivery location (within threshold km).
 */
export function isCourierNearDelivery(courierLocation: { lat: number; lng: number }, deliveryLocation: { lat: number; lng: number }, thresholdKm: number = 2): boolean {
  return calculateDistance(courierLocation, deliveryLocation) <= thresholdKm
}
