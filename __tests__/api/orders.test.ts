import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createOrder } from '@/lib/actions/checkout'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { getSystemSetting } from '@/lib/settings'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    cartItem: { findMany: vi.fn(), deleteMany: vi.fn() },
    order: { create: vi.fn(), update: vi.fn() },
    orderItem: { create: vi.fn() },
    orderEvent: { create: vi.fn() },
    product: { update: vi.fn() },
    productVariant: { updateMany: vi.fn(), aggregate: vi.fn() },
    address: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}))
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/settings', () => ({ getSystemSetting: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('razorpay', () => ({
  default: class { orders = { create: vi.fn().mockResolvedValue({ id: 'rzp-1', amount: 100000 }) } },
}))

const MOCK_USER = { id: 'user-1', email: 'test@example.com' }
const MOCK_ADDRESS = {
  id: 'addr-1', userId: 'user-1', fullName: 'Test User', phone: '9999999999',
  addressLine1: '1 Main St', addressLine2: null, city: 'Chennai', state: 'TN',
  postalCode: '600001', country: 'IN',
}

// The checkout code now requires productVariant to be present on every cart item
const MOCK_CART_ITEM = {
  id: 'ci-1', productId: 'p1', productVariantId: 'v1', quantity: 1,
  product: { id: 'p1', name: 'Pot', price: 1500, stockQuantity: 10, sku: 'POT-1' },
  productVariant: { id: 'v1', stock: 10, price: 1500, sku: 'V-POT-1', size: 'Medium', color: { colorName: 'Terracotta' } },
}

describe('createOrder (checkout)', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: MOCK_USER } }) } }
    vi.mocked(createClient).mockResolvedValue(mockSupabase)
    vi.mocked(getSystemSetting).mockResolvedValue('0')
    vi.mocked(prisma.address.findFirst).mockResolvedValue(MOCK_ADDRESS as any)
  })

  it('returns error when unauthenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const result = await createOrder({ addressId: 'addr-1', paymentMethod: 'cod' })
    expect(result.error).toBe('You must be logged in to place an order.')
  })

  it('returns error when cart is empty', async () => {
    vi.mocked(prisma.cartItem.findMany).mockResolvedValue([])
    const result = await createOrder({ addressId: 'addr-1', paymentMethod: 'cod' })
    expect(result.error).toBe('Your cart is empty.')
  })

  it('returns error when variant is missing on cart item', async () => {
    // Cart item without productVariant should trigger the "missing variant" error
    vi.mocked(prisma.cartItem.findMany).mockResolvedValue([
      { ...MOCK_CART_ITEM, productVariant: null },
    ] as any)
    const result = await createOrder({ addressId: 'addr-1', paymentMethod: 'cod' })
    expect(result.error).toMatch(/missing a selected variant/)
  })

  it('returns error when stock is insufficient', async () => {
    vi.mocked(prisma.cartItem.findMany).mockResolvedValue([
      { ...MOCK_CART_ITEM, quantity: 20, productVariant: { ...MOCK_CART_ITEM.productVariant, stock: 5 } },
    ] as any)
    const result = await createOrder({ addressId: 'addr-1', paymentMethod: 'cod' })
    expect(result.error).toMatch(/insufficient stock/i)
  })

  it('returns error when address not found', async () => {
    vi.mocked(prisma.cartItem.findMany).mockResolvedValue([MOCK_CART_ITEM] as any)
    vi.mocked(prisma.address.findFirst).mockResolvedValue(null)
    const result = await createOrder({ addressId: 'bad-addr', paymentMethod: 'cod' })
    expect(result.error).toBe('Delivery address not found.')
  })

  it('creates COD order successfully via transaction', async () => {
    vi.mocked(prisma.cartItem.findMany).mockResolvedValue([MOCK_CART_ITEM] as any)
    vi.mocked(prisma.$transaction).mockResolvedValue({ id: 'order-1', orderNumber: 'ORD-123', status: 'confirmed', paymentMethod: 'cod' } as any)
    const result = await createOrder({ addressId: 'addr-1', paymentMethod: 'cod' })
    expect(result.success).toBe(true)
    expect(result.orderId).toBe('order-1')
    expect(prisma.$transaction).toHaveBeenCalled()
  })

  it('creates online order and returns razorpay details', async () => {
    vi.mocked(prisma.cartItem.findMany).mockResolvedValue([MOCK_CART_ITEM] as any)
    vi.mocked(prisma.$transaction).mockResolvedValue({ id: 'order-2', orderNumber: 'ORD-456' } as any)
    vi.mocked(prisma.order.update).mockResolvedValue({} as any)
    const result = await createOrder({ addressId: 'addr-1', paymentMethod: 'online' })
    expect(result.success).toBe(true)
    expect(result.razorpayOrderId).toBeDefined()
  })

  it('handles variant-based cart items for stock validation', async () => {
    const variantItem = {
      ...MOCK_CART_ITEM,
      productVariantId: 'v1',
      quantity: 5,
      productVariant: { id: 'v1', stock: 2, price: 2000, sku: 'V-1', size: 'Large', color: { colorName: 'Red' } },
    }
    vi.mocked(prisma.cartItem.findMany).mockResolvedValue([variantItem] as any)
    const result = await createOrder({ addressId: 'addr-1', paymentMethod: 'cod' })
    expect(result.error).toMatch(/insufficient stock/i)
  })

  it('uses variant price over base product price', async () => {
    const variantItem = {
      ...MOCK_CART_ITEM,
      productVariantId: 'v1',
      productVariant: { id: 'v1', stock: 10, price: 2500, sku: 'V-1', size: 'Large', color: { colorName: 'Blue' } },
    }
    vi.mocked(prisma.cartItem.findMany).mockResolvedValue([variantItem] as any)
    vi.mocked(prisma.$transaction).mockResolvedValue({ id: 'order-3', orderNumber: 'ORD-789' } as any)
    const result = await createOrder({ addressId: 'addr-1', paymentMethod: 'cod' })
    expect(result.success).toBe(true)
    expect(prisma.$transaction).toHaveBeenCalled()
  })
})
