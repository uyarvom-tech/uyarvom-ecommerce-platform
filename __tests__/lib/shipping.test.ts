import { describe, it, expect } from 'vitest'
import {
  getDeliveryZone,
  calculateCarrierRate,
  getAllRates,
  selectOptimalCarrier,
  isValidTrackingTransition,
  generateDeliverySlots,
  generateAWB,
  DEFAULT_CARRIERS,
  NDR_REASONS,
  SHIPMENT_STATUS_FLOW,
} from '@/lib/shipping'

describe('Shipping & Logistics', () => {
  describe('Delivery Zone', () => {
    it('returns local for same city', () => {
      expect(getDeliveryZone('Tamil Nadu', 'Tamil Nadu', 'Chennai', 'Chennai')).toBe('local')
    })

    it('returns regional for same state different city', () => {
      expect(getDeliveryZone('Tamil Nadu', 'Tamil Nadu', 'Chennai', 'Coimbatore')).toBe('regional')
    })

    it('returns national for different states', () => {
      expect(getDeliveryZone('Tamil Nadu', 'Maharashtra')).toBe('national')
    })

    it('returns regional for same state without city info', () => {
      expect(getDeliveryZone('Karnataka', 'Karnataka')).toBe('regional')
    })
  })

  describe('Rate Calculation', () => {
    const delhivery = DEFAULT_CARRIERS[0] // Delhivery

    it('calculates basic rate for 500g local', () => {
      const rate = calculateCarrierRate(delhivery, 500, 'local')
      expect(rate.available).toBe(true)
      expect(rate.baseCharge).toBe(40)
      expect(rate.weightCharge).toBe(0) // First 500g included
      expect(rate.totalCharge).toBe(40)
      expect(rate.estimatedDays).toBe(2)
    })

    it('calculates rate for 1.5kg national', () => {
      const rate = calculateCarrierRate(delhivery, 1500, 'national')
      expect(rate.available).toBe(true)
      expect(rate.weightCharge).toBe(20) // (1.5kg - 0.5kg) * 20/kg = 20
      expect(rate.totalCharge).toBe(60) // 40 + 20
      expect(rate.estimatedDays).toBe(7)
    })

    it('adds COD charge', () => {
      const rate = calculateCarrierRate(delhivery, 500, 'local', true)
      expect(rate.codCharge).toBe(30)
      expect(rate.totalCharge).toBe(70) // 40 + 30
    })

    it('rejects below minimum weight', () => {
      const rate = calculateCarrierRate(delhivery, 50, 'local')
      expect(rate.available).toBe(false)
      expect(rate.reason).toContain('Minimum weight')
    })

    it('rejects above maximum weight', () => {
      const rate = calculateCarrierRate(delhivery, 50000, 'local')
      expect(rate.available).toBe(false)
      expect(rate.reason).toContain('Maximum weight')
    })

    it('rejects COD for carrier without COD', () => {
      const fedex = DEFAULT_CARRIERS[3] // FedEx, no COD
      const rate = calculateCarrierRate(fedex, 1000, 'local', true)
      expect(rate.available).toBe(false)
      expect(rate.reason).toContain('COD not available')
    })
  })

  describe('Rate Comparison', () => {
    it('returns all carriers sorted by cheapest', () => {
      const rates = getAllRates(DEFAULT_CARRIERS, 1000, 'regional')
      expect(rates.length).toBe(4)
      // Available ones should be sorted cheapest first
      const available = rates.filter((r) => r.available)
      for (let i = 1; i < available.length; i++) {
        expect(available[i].totalCharge).toBeGreaterThanOrEqual(available[i - 1].totalCharge)
      }
    })

    it('filters unavailable carriers to end', () => {
      const rates = getAllRates(DEFAULT_CARRIERS, 1000, 'regional', true) // COD
      const fedex = rates.find((r) => r.carrierCode === 'fedex')
      expect(fedex?.available).toBe(false)
    })
  })

  describe('Optimal Carrier Selection', () => {
    it('selects cheapest available carrier', () => {
      const optimal = selectOptimalCarrier(DEFAULT_CARRIERS, 1000, 'local')
      expect(optimal).not.toBeNull()
      expect(optimal!.available).toBe(true)
    })

    it('returns null when no carrier available', () => {
      const tinyCarriers = [{ ...DEFAULT_CARRIERS[0], minWeight: 5000 }]
      const optimal = selectOptimalCarrier(tinyCarriers, 100, 'local')
      expect(optimal).toBeNull()
    })
  })

  describe('Tracking Status Transitions', () => {
    it('allows forward transitions', () => {
      expect(isValidTrackingTransition('created', 'pickup_scheduled')).toBe(true)
      expect(isValidTrackingTransition('picked_up', 'in_transit')).toBe(true)
      expect(isValidTrackingTransition('in_transit', 'delivered')).toBe(true)
    })

    it('rejects backward transitions', () => {
      expect(isValidTrackingTransition('delivered', 'in_transit')).toBe(false)
      expect(isValidTrackingTransition('in_transit', 'created')).toBe(false)
    })

    it('allows transition to failed from any state', () => {
      expect(isValidTrackingTransition('in_transit', 'failed')).toBe(true)
      expect(isValidTrackingTransition('out_for_delivery', 'failed')).toBe(true)
    })

    it('allows same status (no-op)', () => {
      expect(isValidTrackingTransition('in_transit', 'in_transit')).toBe(true)
    })
  })

  describe('Delivery Slots', () => {
    it('generates slots for N days', () => {
      const slots = generateDeliverySlots(3)
      expect(slots.length).toBe(9) // 3 days × 3 slots/day
    })

    it('each slot has correct structure', () => {
      const slots = generateDeliverySlots(1)
      expect(slots[0]).toHaveProperty('date')
      expect(slots[0]).toHaveProperty('timeStart')
      expect(slots[0]).toHaveProperty('timeEnd')
      expect(slots[0]).toHaveProperty('available')
      expect(slots[0]).toHaveProperty('maxOrders')
    })

    it('slots are for future dates only', () => {
      const slots = generateDeliverySlots(2)
      const today = new Date().toISOString().split('T')[0]
      for (const slot of slots) {
        expect(slot.date > today).toBe(true)
      }
    })

    it('respects maxOrders parameter', () => {
      const slots = generateDeliverySlots(1, 50)
      expect(slots[0].maxOrders).toBe(50)
    })
  })

  describe('AWB Generation', () => {
    it('generates AWB with carrier prefix', () => {
      const awb = generateAWB('delhivery')
      expect(awb.startsWith('DEL')).toBe(true)
      expect(awb.length).toBeGreaterThan(10)
    })

    it('generates unique AWBs', () => {
      const awb1 = generateAWB('bluedart')
      const awb2 = generateAWB('bluedart')
      expect(awb1).not.toBe(awb2)
    })
  })

  describe('Constants', () => {
    it('DEFAULT_CARRIERS has 4 carriers', () => {
      expect(DEFAULT_CARRIERS).toHaveLength(4)
    })

    it('NDR_REASONS covers all cases', () => {
      expect(NDR_REASONS.length).toBeGreaterThanOrEqual(4)
      const values = NDR_REASONS.map((r) => r.value)
      expect(values).toContain('customer_unavailable')
      expect(values).toContain('wrong_address')
    })

    it('SHIPMENT_STATUS_FLOW has correct order', () => {
      expect(SHIPMENT_STATUS_FLOW[0]).toBe('created')
      expect(SHIPMENT_STATUS_FLOW[SHIPMENT_STATUS_FLOW.length - 1]).toBe('delivered')
    })
  })
})
