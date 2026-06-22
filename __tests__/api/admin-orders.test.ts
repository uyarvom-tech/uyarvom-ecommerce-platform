import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    orderItem: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    orderEvent: {
      create: vi.fn(),
    },
    productVariant: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/auth-middleware', () => ({
  requireStaffAccess: vi.fn().mockResolvedValue({ userId: 'admin-1', role: 'admin' }),
}))

import { prisma } from '@/lib/prisma'
import { GET, POST } from '@/app/api/admin/orders/route'
import { POST as fulfillOrder } from '@/app/api/admin/orders/[id]/fulfill/route'
import { POST as bulkProcess } from '@/app/api/admin/orders/bulk/route'

const mockPrisma = vi.mocked(prisma)

describe('GET /api/admin/orders', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns paginated orders', async () => {
    mockPrisma.order.findMany.mockResolvedValue([
      { id: 'o1', orderNumber: 'ORD-001', status: 'pending', total: 1500, createdAt: new Date() },
    ] as any)
    mockPrisma.order.count.mockResolvedValue(1)

    const req = new NextRequest('http://localhost/api/admin/orders')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.orders).toHaveLength(1)
    expect(json.pagination.total).toBe(1)
  })

  it('filters by status', async () => {
    mockPrisma.order.findMany.mockResolvedValue([])
    mockPrisma.order.count.mockResolvedValue(0)

    const req = new NextRequest('http://localhost/api/admin/orders?status=shipped')
    await GET(req)

    expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'shipped' }) })
    )
  })

  it('filters by search term', async () => {
    mockPrisma.order.findMany.mockResolvedValue([])
    mockPrisma.order.count.mockResolvedValue(0)

    const req = new NextRequest('http://localhost/api/admin/orders?search=ORD-001')
    await GET(req)

    expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ OR: expect.any(Array) }) })
    )
  })

  it('filters by date range', async () => {
    mockPrisma.order.findMany.mockResolvedValue([])
    mockPrisma.order.count.mockResolvedValue(0)

    const req = new NextRequest('http://localhost/api/admin/orders?startDate=2026-01-01&endDate=2026-06-30')
    await GET(req)

    expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ createdAt: expect.any(Object) }) })
    )
  })

  it('supports pagination', async () => {
    mockPrisma.order.findMany.mockResolvedValue([])
    mockPrisma.order.count.mockResolvedValue(50)

    const req = new NextRequest('http://localhost/api/admin/orders?page=3&limit=10')
    const res = await GET(req)
    const json = await res.json()

    expect(json.pagination.page).toBe(3)
    expect(json.pagination.pages).toBe(5)
    expect(mockPrisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 20, take: 10 }))
  })
})

describe('POST /api/admin/orders (Manual Order)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma))
  })

  it('rejects missing required fields', async () => {
    const req = new NextRequest('http://localhost/api/admin/orders', {
      method: 'POST',
      body: JSON.stringify({ userId: 'u1' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 404 for non-existent user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/admin/orders', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'nonexistent',
        items: [{ productId: 'p1', variantId: 'v1', quantity: 1 }],
        shippingAddress: { name: 'Test', address1: '123 St', city: 'Chennai', state: 'TN', zip: '600001' },
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('creates order successfully', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'test@test.com' } as any)
    mockPrisma.productVariant.findUnique.mockResolvedValue({
      id: 'v1', productId: 'p1', price: 500, sku: 'SKU-1', size: 'M',
      product: { name: 'Bowl', price: 500, sku: 'P-SKU' },
      color: { colorName: 'Red' },
    } as any)
    mockPrisma.order.create.mockResolvedValue({ id: 'ord-new', orderNumber: 'ORD-123' } as any)
    mockPrisma.orderItem.create.mockResolvedValue({} as any)
    mockPrisma.productVariant.update.mockResolvedValue({} as any)
    mockPrisma.orderEvent.create.mockResolvedValue({} as any)

    const req = new NextRequest('http://localhost/api/admin/orders', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'u1',
        items: [{ productId: 'p1', variantId: 'v1', quantity: 2 }],
        shippingAddress: { name: 'Test', address1: '123 St', city: 'Chennai', state: 'TN', zip: '600001' },
        paymentMethod: 'cod',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
  })
})

describe('POST /api/admin/orders/[id]/fulfill', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma))
  })

  it('updates order status with valid transition', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ id: 'o1', orderNumber: 'ORD-1', status: 'pending', paymentStatus: 'pending' } as any)
    mockPrisma.order.update.mockResolvedValue({ id: 'o1', status: 'confirmed' } as any)
    mockPrisma.orderEvent.create.mockResolvedValue({} as any)

    const req = new NextRequest('http://localhost/api/admin/orders/o1/fulfill', {
      method: 'POST',
      body: JSON.stringify({ status: 'confirmed' }),
    })
    const res = await fulfillOrder(req, { params: Promise.resolve({ id: 'o1' }) })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.newStatus).toBe('confirmed')
  })

  it('rejects invalid transition', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ id: 'o1', status: 'delivered' } as any)

    const req = new NextRequest('http://localhost/api/admin/orders/o1/fulfill', {
      method: 'POST',
      body: JSON.stringify({ status: 'pending' }),
    })
    const res = await fulfillOrder(req, { params: Promise.resolve({ id: 'o1' }) })

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('Cannot transition')
  })

  it('restores stock on cancellation', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ id: 'o1', status: 'pending' } as any)
    mockPrisma.order.update.mockResolvedValue({ id: 'o1', status: 'cancelled' } as any)
    mockPrisma.orderEvent.create.mockResolvedValue({} as any)
    mockPrisma.orderItem.findMany.mockResolvedValue([
      { id: 'oi1', productVariantId: 'v1', quantity: 3 },
    ] as any)
    mockPrisma.productVariant.update.mockResolvedValue({} as any)

    const req = new NextRequest('http://localhost/api/admin/orders/o1/fulfill', {
      method: 'POST',
      body: JSON.stringify({ status: 'cancelled' }),
    })
    const res = await fulfillOrder(req, { params: Promise.resolve({ id: 'o1' }) })
    expect(res.status).toBe(200)

    expect(mockPrisma.productVariant.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'v1' }, data: { stock: { increment: 3 } } })
    )
  })

  it('returns 404 for non-existent order', async () => {
    mockPrisma.order.findUnique.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/admin/orders/bad/fulfill', {
      method: 'POST',
      body: JSON.stringify({ status: 'confirmed' }),
    })
    const res = await fulfillOrder(req, { params: Promise.resolve({ id: 'bad' }) })
    expect(res.status).toBe(404)
  })
})

describe('POST /api/admin/orders/bulk', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma))
  })

  it('processes bulk status update', async () => {
    mockPrisma.order.findMany.mockResolvedValue([
      { id: 'o1', orderNumber: 'ORD-1', status: 'confirmed' },
      { id: 'o2', orderNumber: 'ORD-2', status: 'confirmed' },
    ] as any)
    mockPrisma.order.update.mockResolvedValue({} as any)
    mockPrisma.orderEvent.create.mockResolvedValue({} as any)

    const req = new NextRequest('http://localhost/api/admin/orders/bulk', {
      method: 'POST',
      body: JSON.stringify({ orderIds: ['o1', 'o2'], status: 'processing' }),
    })
    const res = await bulkProcess(req)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.processed).toBe(2)
    expect(json.succeeded).toBe(2)
  })

  it('rejects missing fields', async () => {
    const req = new NextRequest('http://localhost/api/admin/orders/bulk', {
      method: 'POST',
      body: JSON.stringify({ orderIds: [] }),
    })
    const res = await bulkProcess(req)
    expect(res.status).toBe(400)
  })

  it('reports invalid transitions per order', async () => {
    mockPrisma.order.findMany.mockResolvedValue([
      { id: 'o1', orderNumber: 'ORD-1', status: 'delivered' }, // Can't go to shipped
    ] as any)

    const req = new NextRequest('http://localhost/api/admin/orders/bulk', {
      method: 'POST',
      body: JSON.stringify({ orderIds: ['o1'], status: 'shipped' }),
    })
    const res = await bulkProcess(req)
    const json = await res.json()
    expect(json.failed).toBe(1)
    expect(json.results[0].error).toContain('Cannot transition')
  })
})
