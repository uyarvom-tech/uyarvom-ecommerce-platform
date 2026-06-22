import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    productVariant: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn(),
    },
    product: {
      update: vi.fn(),
    },
    stockAdjustment: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    warehouse: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    stockTransfer: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    orderItem: {
      groupBy: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/auth-middleware', () => ({
  requireStaffAccess: vi.fn().mockResolvedValue({ userId: 'admin-1', role: 'admin' }),
}))

import { prisma } from '@/lib/prisma'
import { POST as adjustStock } from '@/app/api/admin/inventory/adjust/route'
import { GET as getHistory } from '@/app/api/admin/inventory/history/route'
import { GET as getWarehouses, POST as createWarehouse } from '@/app/api/admin/inventory/warehouses/route'
import { GET as getTransfers } from '@/app/api/admin/inventory/transfers/route'
import { GET as getForecast } from '@/app/api/admin/inventory/forecast/route'
import { POST as reserveStock, DELETE as releaseStock } from '@/app/api/admin/inventory/reserve/route'

const mockPrisma = vi.mocked(prisma)

describe('POST /api/admin/inventory/adjust', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma))
  })

  it('adjusts stock with increment type', async () => {
    mockPrisma.productVariant.findUnique.mockResolvedValue({ id: 'v1', stock: 10, sku: 'TEST', size: 'M', productId: 'p1' } as any)
    mockPrisma.productVariant.update.mockResolvedValue({ id: 'v1', stock: 15 } as any)
    mockPrisma.stockAdjustment.create.mockResolvedValue({ id: 'adj1' } as any)
    mockPrisma.auditLog.create.mockResolvedValue({} as any)
    mockPrisma.productVariant.aggregate.mockResolvedValue({ _sum: { stock: 15 } } as any)
    mockPrisma.product.update.mockResolvedValue({} as any)

    const req = new NextRequest('http://localhost/api/admin/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({ variantId: 'v1', type: 'increment', quantity: 5, reason: 'received' }),
    })

    const res = await adjustStock(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.previousStock).toBe(10)
    expect(json.newStock).toBe(15)
  })

  it('rejects missing fields', async () => {
    const req = new NextRequest('http://localhost/api/admin/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({ variantId: 'v1' }),
    })

    const res = await adjustStock(req)
    expect(res.status).toBe(400)
  })

  it('rejects invalid reason code', async () => {
    const req = new NextRequest('http://localhost/api/admin/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({ variantId: 'v1', type: 'increment', quantity: 5, reason: 'invalid_reason' }),
    })

    const res = await adjustStock(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('Invalid reason')
  })

  it('rejects decrement below zero', async () => {
    mockPrisma.productVariant.findUnique.mockResolvedValue({ id: 'v1', stock: 3, sku: 'TEST', size: 'M', productId: 'p1' } as any)

    const req = new NextRequest('http://localhost/api/admin/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({ variantId: 'v1', type: 'decrement', quantity: 10, reason: 'damaged' }),
    })

    const res = await adjustStock(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('Insufficient stock')
  })

  it('returns 404 for non-existent variant', async () => {
    mockPrisma.productVariant.findUnique.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/admin/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({ variantId: 'nonexistent', type: 'increment', quantity: 5, reason: 'received' }),
    })

    const res = await adjustStock(req)
    expect(res.status).toBe(404)
  })
})

describe('GET /api/admin/inventory/history', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns paginated adjustment history', async () => {
    mockPrisma.stockAdjustment.findMany.mockResolvedValue([
      { id: 'adj1', variantId: 'v1', type: 'increment', quantity: 5, reason: 'received', createdAt: new Date() },
    ] as any)
    mockPrisma.stockAdjustment.count.mockResolvedValue(1)

    const req = new NextRequest('http://localhost/api/admin/inventory/history')
    const res = await getHistory(req)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.adjustments).toHaveLength(1)
    expect(json.pagination.total).toBe(1)
  })

  it('filters by variantId', async () => {
    mockPrisma.stockAdjustment.findMany.mockResolvedValue([])
    mockPrisma.stockAdjustment.count.mockResolvedValue(0)

    const req = new NextRequest('http://localhost/api/admin/inventory/history?variantId=v1')
    await getHistory(req)

    expect(mockPrisma.stockAdjustment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ variantId: 'v1' }) })
    )
  })

  it('filters by reason', async () => {
    mockPrisma.stockAdjustment.findMany.mockResolvedValue([])
    mockPrisma.stockAdjustment.count.mockResolvedValue(0)

    const req = new NextRequest('http://localhost/api/admin/inventory/history?reason=damaged')
    await getHistory(req)

    expect(mockPrisma.stockAdjustment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ reason: 'damaged' }) })
    )
  })
})

describe('GET /api/admin/inventory/warehouses', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns list of warehouses', async () => {
    mockPrisma.warehouse.findMany.mockResolvedValue([
      { id: 'wh1', name: 'Chennai Warehouse', code: 'WH-CHN', isDefault: true, _count: { warehouseStocks: 50 } },
    ] as any)

    const req = new NextRequest('http://localhost/api/admin/inventory/warehouses')
    const res = await getWarehouses(req)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.warehouses).toHaveLength(1)
    expect(json.warehouses[0].code).toBe('WH-CHN')
  })
})

describe('POST /api/admin/inventory/warehouses', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a new warehouse', async () => {
    mockPrisma.warehouse.findUnique.mockResolvedValue(null)
    mockPrisma.warehouse.create.mockResolvedValue({
      id: 'wh-new', name: 'Mumbai Warehouse', code: 'WH-MUM',
    } as any)

    const req = new NextRequest('http://localhost/api/admin/inventory/warehouses', {
      method: 'POST',
      body: JSON.stringify({ name: 'Mumbai Warehouse', code: 'WH-MUM', city: 'Mumbai' }),
    })

    const res = await createWarehouse(req)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.code).toBe('WH-MUM')
  })

  it('rejects duplicate warehouse code', async () => {
    mockPrisma.warehouse.findUnique.mockResolvedValue({ id: 'existing' } as any)

    const req = new NextRequest('http://localhost/api/admin/inventory/warehouses', {
      method: 'POST',
      body: JSON.stringify({ name: 'Dup', code: 'WH-CHN' }),
    })

    const res = await createWarehouse(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('already exists')
  })

  it('rejects missing fields', async () => {
    const req = new NextRequest('http://localhost/api/admin/inventory/warehouses', {
      method: 'POST',
      body: JSON.stringify({ name: '' }),
    })

    const res = await createWarehouse(req)
    expect(res.status).toBe(400)
  })
})

describe('GET /api/admin/inventory/forecast', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns forecast data with summary', async () => {
    mockPrisma.productVariant.findMany.mockResolvedValue([
      { id: 'v1', stock: 50, sku: 'SKU-1', size: 'M', product: { id: 'p1', name: 'Bowl', lowStockThreshold: 10 }, color: { colorName: 'Red' } },
    ] as any)
    mockPrisma.orderItem.groupBy.mockResolvedValue([
      { productVariantId: 'v1', _sum: { quantity: 30 } },
    ] as any)

    const req = new NextRequest('http://localhost/api/admin/inventory/forecast?days=30')
    const res = await getForecast(req)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.forecasts).toHaveLength(1)
    expect(json.summary).toHaveProperty('critical')
    expect(json.summary).toHaveProperty('low')
    expect(json.summary).toHaveProperty('adequate')
    expect(json.periodDays).toBe(30)
  })
})

describe('POST /api/admin/inventory/reserve', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma))
  })

  it('reserves stock successfully', async () => {
    mockPrisma.productVariant.findUnique.mockResolvedValue({ id: 'v1', stock: 20 } as any)
    mockPrisma.productVariant.update.mockResolvedValue({ id: 'v1', stock: 15 } as any)
    mockPrisma.stockAdjustment.create.mockResolvedValue({} as any)

    const req = new NextRequest('http://localhost/api/admin/inventory/reserve', {
      method: 'POST',
      body: JSON.stringify({ variantId: 'v1', quantity: 5, orderId: 'ord-1' }),
    })

    const res = await reserveStock(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.reserved).toBe(5)
  })

  it('rejects reservation exceeding stock', async () => {
    mockPrisma.productVariant.findUnique.mockResolvedValue({ id: 'v1', stock: 3 } as any)

    const req = new NextRequest('http://localhost/api/admin/inventory/reserve', {
      method: 'POST',
      body: JSON.stringify({ variantId: 'v1', quantity: 10 }),
    })

    const res = await reserveStock(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('Insufficient stock')
  })
})

describe('DELETE /api/admin/inventory/reserve', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma))
  })

  it('releases reserved stock', async () => {
    mockPrisma.productVariant.findUnique.mockResolvedValue({ id: 'v1', stock: 15 } as any)
    mockPrisma.productVariant.update.mockResolvedValue({ id: 'v1', stock: 20 } as any)
    mockPrisma.stockAdjustment.create.mockResolvedValue({} as any)

    const req = new NextRequest('http://localhost/api/admin/inventory/reserve', {
      method: 'DELETE',
      body: JSON.stringify({ variantId: 'v1', quantity: 5, orderId: 'ord-1' }),
    })

    const res = await releaseStock(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.released).toBe(5)
  })
})
