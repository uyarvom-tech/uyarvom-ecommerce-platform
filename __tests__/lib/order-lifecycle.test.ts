import { describe, it, expect } from 'vitest'
import {
  isValidExtendedTransition,
  generatePickList,
  generatePackingSlip,
  verifyBarcodeScan,
  checkOrderStock,
  generateShippingLabelData,
  ORDER_STATUS_FLOW,
} from '@/lib/order-lifecycle'

describe('Enhanced Order Lifecycle', () => {
  describe('Extended Status Transitions', () => {
    it('follows full 14-stage flow', () => {
      expect(isValidExtendedTransition('pending_payment', 'payment_confirmed')).toBe(true)
      expect(isValidExtendedTransition('payment_confirmed', 'order_received')).toBe(true)
      expect(isValidExtendedTransition('order_received', 'processing')).toBe(true)
      expect(isValidExtendedTransition('processing', 'packaging')).toBe(true)
      expect(isValidExtendedTransition('packaging', 'ready_for_pickup')).toBe(true)
      expect(isValidExtendedTransition('ready_for_pickup', 'courier_assigned')).toBe(true)
      expect(isValidExtendedTransition('courier_assigned', 'picked_up')).toBe(true)
      expect(isValidExtendedTransition('picked_up', 'in_transit')).toBe(true)
      expect(isValidExtendedTransition('in_transit', 'out_for_delivery')).toBe(true)
      expect(isValidExtendedTransition('out_for_delivery', 'delivered')).toBe(true)
    })

    it('allows delivery failure from in_transit or out_for_delivery', () => {
      expect(isValidExtendedTransition('in_transit', 'delivery_failed')).toBe(true)
      expect(isValidExtendedTransition('out_for_delivery', 'delivery_failed')).toBe(true)
    })

    it('allows return flow', () => {
      expect(isValidExtendedTransition('delivered', 'return_requested')).toBe(true)
      expect(isValidExtendedTransition('return_requested', 'returned')).toBe(true)
    })

    it('allows retry after failure', () => {
      expect(isValidExtendedTransition('delivery_failed', 'courier_assigned')).toBe(true)
    })

    it('rejects invalid transitions', () => {
      expect(isValidExtendedTransition('pending_payment', 'delivered')).toBe(false)
      expect(isValidExtendedTransition('returned', 'processing')).toBe(false)
      expect(isValidExtendedTransition('packaging', 'delivered')).toBe(false)
    })

    it('allows same status (no-op)', () => {
      expect(isValidExtendedTransition('processing', 'processing')).toBe(true)
    })
  })

  describe('Pick List Generation', () => {
    it('generates pick list from order items', () => {
      const items = [
        { id: 'oi1', productId: 'p1', productName: 'Bowl', sku: 'SKU-001', variantName: 'Red / M', quantity: 2, binLocation: 'ZA-A01-S01-P01', barcode: '8901234' },
        { id: 'oi2', productId: 'p2', productName: 'Plate', sku: 'SKU-002', variantName: 'Blue / L', quantity: 1 },
      ]
      const pl = generatePickList('o1', 'ORD-001', items)
      expect(pl.orderId).toBe('o1')
      expect(pl.orderNumber).toBe('ORD-001')
      expect(pl.totalItems).toBe(2)
      expect(pl.totalQuantity).toBe(3) // 2 + 1
      expect(pl.items[0].binLocation).toBe('ZA-A01-S01-P01')
      expect(pl.items[0].barcode).toBe('8901234')
    })

    it('handles items without bin location', () => {
      const items = [{ id: 'oi1', productId: 'p1', productName: 'Cup', sku: 'SKU-003', variantName: '', quantity: 5 }]
      const pl = generatePickList('o2', 'ORD-002', items)
      expect(pl.items[0].binLocation).toBeUndefined()
      expect(pl.items[0].variantLabel).toBe('Default') // Empty variant → Default
    })
  })

  describe('Packing Slip Generation', () => {
    it('generates complete packing slip', () => {
      const slip = generatePackingSlip(
        'o1', 'ORD-001',
        { name: 'John Doe', address: '123 Main St, Chennai 600001', phone: '9876543210' },
        [{ productName: 'Bowl', sku: 'SKU-001', variant: 'Red / M', quantity: 2 }],
        'Handle with care',
      )
      expect(slip.orderNumber).toBe('ORD-001')
      expect(slip.customerName).toBe('John Doe')
      expect(slip.totalItems).toBe(2)
      expect(slip.notes).toBe('Handle with care')
      expect(slip.generatedAt).toBeInstanceOf(Date)
    })

    it('calculates total items across all line items', () => {
      const slip = generatePackingSlip('o1', 'ORD-001', { name: 'A', address: 'B', phone: 'C' }, [
        { productName: 'A', sku: 'S1', variant: 'X', quantity: 3 },
        { productName: 'B', sku: 'S2', variant: 'Y', quantity: 2 },
      ])
      expect(slip.totalItems).toBe(5)
    })
  })

  describe('Barcode Scanning', () => {
    const items = [
      { barcode: '8901234567890', productId: 'p1', sku: 'SKU-001' },
      { barcode: '8901234567891', productId: 'p2', sku: 'SKU-002' },
    ]

    it('matches correct barcode', () => {
      const result = verifyBarcodeScan('8901234567890', items)
      expect(result.matched).toBe(true)
      expect(result.productId).toBe('p1')
    })

    it('matches by SKU as fallback', () => {
      const result = verifyBarcodeScan('SKU-002', items)
      expect(result.matched).toBe(true)
      expect(result.productId).toBe('p2')
    })

    it('rejects unknown barcode', () => {
      const result = verifyBarcodeScan('9999999999999', items)
      expect(result.matched).toBe(false)
      expect(result.error).toContain('does not match')
    })

    it('rejects empty barcode', () => {
      const result = verifyBarcodeScan('', items)
      expect(result.matched).toBe(false)
      expect(result.error).toContain('Empty barcode')
    })
  })

  describe('Stock Check', () => {
    it('all in stock', () => {
      const items = [
        { productId: 'p1', productName: 'Bowl', quantity: 2, availableStock: 10 },
        { productId: 'p2', productName: 'Plate', quantity: 1, availableStock: 5 },
      ]
      const result = checkOrderStock(items)
      expect(result.allInStock).toBe(true)
      expect(result.outOfStockItems).toHaveLength(0)
    })

    it('identifies out of stock items', () => {
      const items = [
        { productId: 'p1', productName: 'Bowl', quantity: 10, availableStock: 3 },
        { productId: 'p2', productName: 'Plate', quantity: 1, availableStock: 5 },
      ]
      const result = checkOrderStock(items)
      expect(result.allInStock).toBe(false)
      expect(result.outOfStockItems).toHaveLength(1)
      expect(result.outOfStockItems[0].productId).toBe('p1')
      expect(result.outOfStockItems[0].requested).toBe(10)
      expect(result.outOfStockItems[0].available).toBe(3)
    })
  })

  describe('Shipping Label', () => {
    it('generates label for COD order', () => {
      const label = generateShippingLabelData(
        { id: 'o1', orderNumber: 'ORD-001', total: 1500, paymentMethod: 'cod' },
        { name: 'John', address: '123 St', city: 'Chennai', state: 'TN', pincode: '600001', phone: '9876' },
        { name: 'Delhivery', trackingId: 'DEL123' },
        500,
      )
      expect(label.isCOD).toBe(true)
      expect(label.codAmount).toBe(1500)
      expect(label.trackingId).toBe('DEL123')
      expect(label.courierName).toBe('Delhivery')
      expect(label.weight).toBe(500)
    })

    it('generates label for prepaid order (no COD amount)', () => {
      const label = generateShippingLabelData(
        { id: 'o2', orderNumber: 'ORD-002', total: 2000, paymentMethod: 'online' },
        { name: 'Jane', address: '456 Ave', city: 'Mumbai', state: 'MH', pincode: '400001', phone: '8765' },
        { name: 'BlueDart', trackingId: 'BD456' },
      )
      expect(label.isCOD).toBe(false)
      expect(label.codAmount).toBeUndefined()
    })
  })

  describe('Constants', () => {
    it('ORDER_STATUS_FLOW has 14 stages', () => {
      expect(ORDER_STATUS_FLOW).toHaveLength(14)
    })

    it('each status has label and actor', () => {
      for (const s of ORDER_STATUS_FLOW) {
        expect(s.status).toBeTruthy()
        expect(s.label).toBeTruthy()
        expect(s.actor).toBeTruthy()
      }
    })
  })
})
