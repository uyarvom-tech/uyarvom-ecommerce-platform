import { describe, it, expect } from 'vitest'
import {
  isValidCourierTransition,
  getNextCourierStatuses,
  validateStatusUpdate,
  scoreCourierForAssignment,
  selectBestCourier,
  calculateCourierPerformance,
  calculateDistance,
  isCourierNearDelivery,
  DELIVERY_STATUSES,
  FAILURE_REASONS,
} from '@/lib/courier'

describe('Courier Portal & Delivery Management', () => {
  describe('Status Transitions', () => {
    it('allows assigned → picked_up', () => {
      expect(isValidCourierTransition('assigned', 'picked_up')).toBe(true)
    })
    it('allows picked_up → in_transit', () => {
      expect(isValidCourierTransition('picked_up', 'in_transit')).toBe(true)
    })
    it('allows in_transit → out_for_delivery', () => {
      expect(isValidCourierTransition('in_transit', 'out_for_delivery')).toBe(true)
    })
    it('allows out_for_delivery → delivered', () => {
      expect(isValidCourierTransition('out_for_delivery', 'delivered')).toBe(true)
    })
    it('allows out_for_delivery → failed', () => {
      expect(isValidCourierTransition('out_for_delivery', 'failed')).toBe(true)
    })
    it('allows failed → rescheduled', () => {
      expect(isValidCourierTransition('failed', 'rescheduled')).toBe(true)
    })
    it('allows failed → picked_up (retry)', () => {
      expect(isValidCourierTransition('failed', 'picked_up')).toBe(true)
    })
    it('rejects delivered → anything (terminal)', () => {
      expect(isValidCourierTransition('delivered', 'in_transit')).toBe(false)
    })
    it('rejects backward transitions', () => {
      expect(isValidCourierTransition('in_transit', 'assigned')).toBe(false)
    })
    it('allows same status', () => {
      expect(isValidCourierTransition('in_transit', 'in_transit')).toBe(true)
    })
  })

  describe('getNextCourierStatuses', () => {
    it('assigned can go to picked_up', () => {
      expect(getNextCourierStatuses('assigned')).toEqual(['picked_up'])
    })
    it('out_for_delivery can go to delivered or failed', () => {
      const next = getNextCourierStatuses('out_for_delivery')
      expect(next).toContain('delivered')
      expect(next).toContain('failed')
    })
    it('delivered has no next statuses', () => {
      expect(getNextCourierStatuses('delivered')).toHaveLength(0)
    })
  })

  describe('Status Update Validation', () => {
    it('validates correct delivery update', () => {
      const result = validateStatusUpdate({
        orderId: 'o1', courierId: 'c1', status: 'delivered',
        proofOfDeliveryUrl: 'https://r2.dev/proof.jpg',
      }, 'out_for_delivery')
      expect(result.valid).toBe(true)
    })

    it('requires proof for delivered status', () => {
      const result = validateStatusUpdate({
        orderId: 'o1', courierId: 'c1', status: 'delivered',
      }, 'out_for_delivery')
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('Proof of delivery')
    })

    it('requires failure reason for failed status', () => {
      const result = validateStatusUpdate({
        orderId: 'o1', courierId: 'c1', status: 'failed',
      }, 'out_for_delivery')
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('Failure reason')
    })

    it('requires reschedule date for rescheduled status', () => {
      const result = validateStatusUpdate({
        orderId: 'o1', courierId: 'c1', status: 'rescheduled',
      }, 'failed')
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('Reschedule date')
    })

    it('rejects past reschedule date', () => {
      const result = validateStatusUpdate({
        orderId: 'o1', courierId: 'c1', status: 'rescheduled',
        rescheduleDate: '2020-01-01',
      }, 'failed')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Reschedule date must be in the future')
    })

    it('rejects invalid transition', () => {
      const result = validateStatusUpdate({
        orderId: 'o1', courierId: 'c1', status: 'delivered',
        proofOfDeliveryUrl: 'url',
      }, 'assigned') // Can't go from assigned to delivered directly
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('Cannot transition')
    })
  })

  describe('Courier Assignment', () => {
    const couriers = [
      { id: 'c1', name: 'Ravi', email: 'r@t.com', phone: '9876', vehicleType: 'Bike', serviceArea: 'Chennai', isActive: true, activeOrders: 3, completedOrders: 50 },
      { id: 'c2', name: 'Kumar', email: 'k@t.com', phone: '8765', vehicleType: 'Bike', serviceArea: 'Chennai', isActive: true, activeOrders: 1, completedOrders: 80 },
      { id: 'c3', name: 'Vijay', email: 'v@t.com', phone: '7654', vehicleType: 'Van', serviceArea: 'Mumbai', isActive: true, activeOrders: 0, completedOrders: 20 },
      { id: 'c4', name: 'Inactive', email: 'i@t.com', phone: '6543', vehicleType: 'Bike', serviceArea: 'Chennai', isActive: false, activeOrders: 0, completedOrders: 10 },
    ]

    it('scores lower for fewer active orders', () => {
      const s1 = scoreCourierForAssignment(couriers[0], 'Chennai')
      const s2 = scoreCourierForAssignment(couriers[1], 'Chennai')
      expect(s2).toBeLessThan(s1) // Kumar (1 order) < Ravi (3 orders)
    })

    it('scores lower for matching service area', () => {
      const s_match = scoreCourierForAssignment(couriers[2], 'Mumbai')
      const s_nomatch = scoreCourierForAssignment(couriers[2], 'Chennai')
      expect(s_match).toBeLessThan(s_nomatch)
    })

    it('heavily penalizes inactive couriers', () => {
      const s = scoreCourierForAssignment(couriers[3], 'Chennai')
      expect(s).toBeGreaterThan(500)
    })

    it('selectBestCourier picks least-loaded in matching area', () => {
      const best = selectBestCourier(couriers, 'Chennai')
      expect(best?.id).toBe('c2') // Kumar: 1 order + Chennai match
    })

    it('selectBestCourier skips inactive couriers', () => {
      const best = selectBestCourier(couriers, 'Chennai')
      expect(best?.id).not.toBe('c4')
    })

    it('selectBestCourier returns null if no active couriers', () => {
      const inactive = [{ ...couriers[3] }]
      expect(selectBestCourier(inactive, 'Chennai')).toBeNull()
    })
  })

  describe('Performance Metrics', () => {
    it('calculates success rate', () => {
      const perf = calculateCourierPerformance(100, 92, 8, 460, 85)
      expect(perf.successRate).toBe(92)
      expect(perf.failedDeliveries).toBe(8)
    })

    it('calculates avg delivery time', () => {
      const perf = calculateCourierPerformance(50, 45, 5, 90, 40)
      expect(perf.avgDeliveryTimeHours).toBe(2) // 90/45 = 2
    })

    it('rates excellent for 95%+ success and 90%+ on-time', () => {
      const perf = calculateCourierPerformance(100, 96, 4, 200, 92)
      expect(perf.rating).toBe('excellent')
    })

    it('rates good for 85-94% success', () => {
      const perf = calculateCourierPerformance(100, 88, 12, 200, 80)
      expect(perf.rating).toBe('good')
    })

    it('rates average for 70-84% success', () => {
      const perf = calculateCourierPerformance(100, 75, 25, 200, 50)
      expect(perf.rating).toBe('average')
    })

    it('rates poor below 70%', () => {
      const perf = calculateCourierPerformance(100, 60, 40, 200, 30)
      expect(perf.rating).toBe('poor')
    })

    it('handles zero deliveries gracefully', () => {
      const perf = calculateCourierPerformance(0, 0, 0, 0, 0)
      expect(perf.successRate).toBe(0)
      expect(perf.avgDeliveryTimeHours).toBe(0)
    })
  })

  describe('GPS & Distance', () => {
    it('calculates distance between two points', () => {
      // Chennai to Bangalore ≈ 290 km
      const dist = calculateDistance({ lat: 13.08, lng: 80.27 }, { lat: 12.97, lng: 77.59 })
      expect(dist).toBeGreaterThan(250)
      expect(dist).toBeLessThan(350)
    })

    it('distance is 0 for same point', () => {
      expect(calculateDistance({ lat: 13.08, lng: 80.27 }, { lat: 13.08, lng: 80.27 })).toBe(0)
    })

    it('isCourierNearDelivery returns true within threshold', () => {
      // ~1km apart
      expect(isCourierNearDelivery({ lat: 13.08, lng: 80.27 }, { lat: 13.085, lng: 80.275 }, 2)).toBe(true)
    })

    it('isCourierNearDelivery returns false beyond threshold', () => {
      // Chennai to Bangalore — way beyond 2km
      expect(isCourierNearDelivery({ lat: 13.08, lng: 80.27 }, { lat: 12.97, lng: 77.59 }, 2)).toBe(false)
    })
  })

  describe('Constants', () => {
    it('has 7 delivery statuses', () => {
      expect(DELIVERY_STATUSES).toHaveLength(7)
    })
    it('has 6 failure reasons', () => {
      expect(FAILURE_REASONS).toHaveLength(6)
    })
  })
})
