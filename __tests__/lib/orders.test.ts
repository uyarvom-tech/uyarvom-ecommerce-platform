import { describe, it, expect } from 'vitest'
import {
  isValidTransition,
  getNextStatuses,
  canCancel,
  canReturn,
  canExchange,
  validateSplitShipment,
  calculateFulfillmentStatus,
  identifyBackorders,
  generateOrderNumber,
  generateOrderConfirmationEmail,
  generateShippingEmail,
  EXCHANGE_REASONS,
} from '@/lib/orders'

describe('Order State Machine', () => {
  describe('isValidTransition', () => {
    it('allows pending → confirmed', () => {
      expect(isValidTransition('pending', 'confirmed')).toBe(true)
    })

    it('allows pending → processing', () => {
      expect(isValidTransition('pending', 'processing')).toBe(true)
    })

    it('allows pending → cancelled', () => {
      expect(isValidTransition('pending', 'cancelled')).toBe(true)
    })

    it('allows confirmed → processing', () => {
      expect(isValidTransition('confirmed', 'processing')).toBe(true)
    })

    it('allows confirmed → shipped', () => {
      expect(isValidTransition('confirmed', 'shipped')).toBe(true)
    })

    it('allows processing → shipped', () => {
      expect(isValidTransition('processing', 'shipped')).toBe(true)
    })

    it('allows shipped → delivered', () => {
      expect(isValidTransition('shipped', 'delivered')).toBe(true)
    })

    it('rejects delivered → anything', () => {
      expect(isValidTransition('delivered', 'pending')).toBe(false)
      expect(isValidTransition('delivered', 'cancelled')).toBe(false)
      expect(isValidTransition('delivered', 'shipped')).toBe(false)
    })

    it('rejects cancelled → anything', () => {
      expect(isValidTransition('cancelled', 'pending')).toBe(false)
      expect(isValidTransition('cancelled', 'confirmed')).toBe(false)
    })

    it('rejects shipped → cancelled (cannot cancel after shipping)', () => {
      expect(isValidTransition('shipped', 'cancelled')).toBe(false)
    })

    it('allows same status (no-op)', () => {
      expect(isValidTransition('pending', 'pending')).toBe(true)
      expect(isValidTransition('shipped', 'shipped')).toBe(true)
    })
  })

  describe('getNextStatuses', () => {
    it('returns valid next statuses for pending', () => {
      const next = getNextStatuses('pending')
      expect(next).toContain('confirmed')
      expect(next).toContain('cancelled')
      expect(next).not.toContain('delivered')
    })

    it('returns empty for terminal states', () => {
      expect(getNextStatuses('delivered')).toHaveLength(0)
      expect(getNextStatuses('cancelled')).toHaveLength(0)
    })
  })

  describe('canCancel', () => {
    it('allows cancellation for pending/confirmed/processing', () => {
      expect(canCancel('pending')).toBe(true)
      expect(canCancel('confirmed')).toBe(true)
      expect(canCancel('processing')).toBe(true)
    })

    it('disallows cancellation for shipped/delivered/cancelled', () => {
      expect(canCancel('shipped')).toBe(false)
      expect(canCancel('delivered')).toBe(false)
      expect(canCancel('cancelled')).toBe(false)
    })
  })

  describe('canReturn', () => {
    it('allows return within 7 days of delivery', () => {
      const deliveredAt = new Date()
      deliveredAt.setDate(deliveredAt.getDate() - 3) // 3 days ago
      expect(canReturn('delivered', deliveredAt)).toBe(true)
    })

    it('disallows return after 7 days', () => {
      const deliveredAt = new Date()
      deliveredAt.setDate(deliveredAt.getDate() - 10) // 10 days ago
      expect(canReturn('delivered', deliveredAt)).toBe(false)
    })

    it('disallows return for non-delivered orders', () => {
      expect(canReturn('shipped', new Date())).toBe(false)
      expect(canReturn('pending', new Date())).toBe(false)
    })

    it('disallows return when deliveredAt is null', () => {
      expect(canReturn('delivered', null)).toBe(false)
    })

    it('respects custom return window', () => {
      const deliveredAt = new Date()
      deliveredAt.setDate(deliveredAt.getDate() - 12) // 12 days ago
      expect(canReturn('delivered', deliveredAt, 14)).toBe(true) // 14-day window
      expect(canReturn('delivered', deliveredAt, 7)).toBe(false) // 7-day window
    })
  })
})

describe('Split Shipments', () => {
  describe('validateSplitShipment', () => {
    const orderItems = [
      { id: 'item-1', quantity: 5, shippedQuantity: 0 },
      { id: 'item-2', quantity: 3, shippedQuantity: 1 },
    ]

    it('validates valid partial shipment', () => {
      const result = validateSplitShipment(orderItems, [{ orderItemId: 'item-1', quantity: 2 }])
      expect(result.valid).toBe(true)
    })

    it('rejects empty shipment items', () => {
      const result = validateSplitShipment(orderItems, [])
      expect(result.valid).toBe(false)
    })

    it('rejects shipment exceeding remaining quantity', () => {
      const result = validateSplitShipment(orderItems, [{ orderItemId: 'item-2', quantity: 5 }])
      expect(result.valid).toBe(false)
      expect(result.error).toContain('remaining')
    })

    it('rejects zero quantity', () => {
      const result = validateSplitShipment(orderItems, [{ orderItemId: 'item-1', quantity: 0 }])
      expect(result.valid).toBe(false)
    })

    it('rejects unknown order item', () => {
      const result = validateSplitShipment(orderItems, [{ orderItemId: 'unknown', quantity: 1 }])
      expect(result.valid).toBe(false)
      expect(result.error).toContain('not found')
    })
  })

  describe('calculateFulfillmentStatus', () => {
    it('returns unfulfilled when nothing shipped', () => {
      const items = [{ quantity: 5, shippedQuantity: 0 }, { quantity: 3, shippedQuantity: 0 }]
      expect(calculateFulfillmentStatus(items)).toBe('unfulfilled')
    })

    it('returns partially_fulfilled when some shipped', () => {
      const items = [{ quantity: 5, shippedQuantity: 2 }, { quantity: 3, shippedQuantity: 0 }]
      expect(calculateFulfillmentStatus(items)).toBe('partially_fulfilled')
    })

    it('returns fulfilled when all shipped', () => {
      const items = [{ quantity: 5, shippedQuantity: 5 }, { quantity: 3, shippedQuantity: 3 }]
      expect(calculateFulfillmentStatus(items)).toBe('fulfilled')
    })
  })
})

describe('Backorder Management', () => {
  describe('identifyBackorders', () => {
    it('identifies items with insufficient stock', () => {
      const items = [
        { productId: 'p1', variantId: 'v1', requestedQty: 10, availableStock: 5 },
        { productId: 'p2', variantId: 'v2', requestedQty: 3, availableStock: 10 },
      ]
      const backorders = identifyBackorders(items)
      expect(backorders).toHaveLength(1)
      expect(backorders[0].variantId).toBe('v1')
      expect(backorders[0].backorderQty).toBe(5)
    })

    it('returns empty when all stock is sufficient', () => {
      const items = [
        { productId: 'p1', variantId: 'v1', requestedQty: 3, availableStock: 10 },
      ]
      expect(identifyBackorders(items)).toHaveLength(0)
    })

    it('handles exact stock match (no backorder)', () => {
      const items = [
        { productId: 'p1', variantId: 'v1', requestedQty: 5, availableStock: 5 },
      ]
      expect(identifyBackorders(items)).toHaveLength(0)
    })
  })
})

describe('Exchange Management', () => {
  describe('canExchange', () => {
    it('allows exchange within 7 days of delivery', () => {
      const deliveredAt = new Date()
      deliveredAt.setDate(deliveredAt.getDate() - 3)
      const result = canExchange('delivered', deliveredAt)
      expect(result.eligible).toBe(true)
    })

    it('disallows exchange for non-delivered orders', () => {
      const result = canExchange('shipped', new Date())
      expect(result.eligible).toBe(false)
      expect(result.reason).toContain('delivered')
    })

    it('disallows exchange after window expires', () => {
      const deliveredAt = new Date()
      deliveredAt.setDate(deliveredAt.getDate() - 10)
      const result = canExchange('delivered', deliveredAt, 7)
      expect(result.eligible).toBe(false)
      expect(result.reason).toContain('expired')
    })

    it('respects custom exchange window', () => {
      const deliveredAt = new Date()
      deliveredAt.setDate(deliveredAt.getDate() - 12)
      expect(canExchange('delivered', deliveredAt, 14).eligible).toBe(true)
    })
  })

  it('EXCHANGE_REASONS has all required reasons', () => {
    const values = EXCHANGE_REASONS.map((r) => r.value)
    expect(values).toContain('wrong_size')
    expect(values).toContain('wrong_color')
    expect(values).toContain('defective')
    expect(values).toContain('changed_mind')
    expect(values).toContain('other')
  })
})

describe('Order Utilities', () => {
  describe('generateOrderNumber', () => {
    it('generates order number with ORD prefix', () => {
      const num = generateOrderNumber()
      expect(num).toMatch(/^ORD-\d+-\d{3}$/)
    })

    it('generates unique numbers', () => {
      const num1 = generateOrderNumber()
      const num2 = generateOrderNumber()
      expect(num1).not.toBe(num2)
    })
  })
})

describe('Order Email Templates', () => {
  const emailData = {
    orderNumber: 'ORD-12345',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    items: [{ name: 'Ceramic Bowl', variant: 'Red / M', quantity: 2, price: 599 }],
    subtotal: 1198,
    tax: 216,
    shipping: 0,
    total: 1414,
    shippingAddress: '123 Main St, Chennai, Tamil Nadu 600001',
    paymentMethod: 'cod',
  }

  describe('generateOrderConfirmationEmail', () => {
    it('returns subject and html', () => {
      const result = generateOrderConfirmationEmail(emailData)
      expect(result.subject).toContain('ORD-12345')
      expect(result.html).toContain('UYARVOM')
      expect(result.html).toContain('John Doe')
      expect(result.html).toContain('Ceramic Bowl')
      expect(result.html).toContain('₹1,414')
    })

    it('shows Cash on Delivery for COD', () => {
      const result = generateOrderConfirmationEmail(emailData)
      expect(result.html).toContain('Cash on Delivery')
    })

    it('shows Online Payment for non-COD', () => {
      const result = generateOrderConfirmationEmail({ ...emailData, paymentMethod: 'razorpay_upi' })
      expect(result.html).toContain('Online Payment')
    })
  })

  describe('generateShippingEmail', () => {
    it('returns subject and html with tracking', () => {
      const result = generateShippingEmail({
        ...emailData,
        trackingNumber: 'DELIV123',
        courierName: 'Delhivery',
      })
      expect(result.subject).toContain('Shipped')
      expect(result.html).toContain('DELIV123')
      expect(result.html).toContain('Delhivery')
    })

    it('handles missing tracking gracefully', () => {
      const result = generateShippingEmail(emailData)
      expect(result.html).not.toContain('undefined')
    })
  })
})
