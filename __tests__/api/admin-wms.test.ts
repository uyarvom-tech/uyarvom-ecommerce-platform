import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    warehouseBin: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    pickList: { findMany: vi.fn(), create: vi.fn() },
    orderItem: { findMany: vi.fn() },
    packSession: { create: vi.fn() },
    order: { findUnique: vi.fn() },
    cycleCount: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    cycleCountItem: { updateMany: vi.fn() },
  },
}))

vi.mock('@/lib/auth-middleware', () => ({
  requireStaffAccess: vi.fn().mockResolvedValue({ userId: 'admin-1', role: 'admin' }),
}))

import { prisma } from '@/lib/prisma'
import { GET as getBins, POST as createBin } from '@/app/api/admin/wms/bins/route'
import { GET as getPickLists, POST as createPickList } from '@/app/api/admin/wms/pick-lists/route'
import { POST as confirmPack } from '@/app/api/admin/wms/pack/route'
import { GET as getCycleCounts, POST as scheduleCycleCount } from '@/app/api/admin/wms/cycle-counts/route'

const mockPrisma = vi.mocked(prisma)

describe('WMS Bins API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('GET returns bin list', async () => {
    mockPrisma.warehouseBin.findMany.mockResolvedValue([{ id: 'b1', code: 'ZA-A01-S01-P01', zone: 'A' }] as any)

    const req = new NextRequest('http://localhost/api/admin/wms/bins')
    const res = await getBins(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.bins).toHaveLength(1)
  })

  it('POST creates a bin', async () => {
    mockPrisma.warehouseBin.findUnique.mockResolvedValue(null)
    mockPrisma.warehouseBin.create.mockResolvedValue({ id: 'b-new', code: 'ZA-A01-S01-P01' } as any)

    const req = new NextRequest('http://localhost/api/admin/wms/bins', {
      method: 'POST',
      body: JSON.stringify({ warehouseId: 'wh1', zone: 'A', aisle: 1, shelf: 1, position: 1 }),
    })
    const res = await createBin(req)
    expect(res.status).toBe(201)
  })

  it('POST rejects duplicate bin code', async () => {
    mockPrisma.warehouseBin.findUnique.mockResolvedValue({ id: 'existing' } as any)

    const req = new NextRequest('http://localhost/api/admin/wms/bins', {
      method: 'POST',
      body: JSON.stringify({ warehouseId: 'wh1', zone: 'A', aisle: 1, shelf: 1, position: 1 }),
    })
    const res = await createBin(req)
    expect(res.status).toBe(400)
  })

  it('POST rejects missing fields', async () => {
    const req = new NextRequest('http://localhost/api/admin/wms/bins', {
      method: 'POST',
      body: JSON.stringify({ warehouseId: 'wh1' }),
    })
    const res = await createBin(req)
    expect(res.status).toBe(400)
  })
})

describe('WMS Pick Lists API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('GET returns pick lists', async () => {
    mockPrisma.pickList.findMany.mockResolvedValue([{ id: 'pl1', pickNumber: 'PL-123', status: 'pending' }] as any)

    const req = new NextRequest('http://localhost/api/admin/wms/pick-lists')
    const res = await getPickLists(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.pickLists).toHaveLength(1)
  })

  it('POST generates pick list from orders', async () => {
    mockPrisma.orderItem.findMany.mockResolvedValue([
      { id: 'oi1', orderId: 'o1', productId: 'p1', productVariantId: 'v1', quantity: 2, productName: 'Bowl', variantName: 'Red/M', product: { name: 'Bowl' }, productVariant: { id: 'v1', sku: 'SKU', size: 'M', color: { colorName: 'Red' } } },
    ] as any)
    mockPrisma.pickList.create.mockResolvedValue({ id: 'pl-new', pickNumber: 'PL-001', items: [{ id: 'pli1' }] } as any)

    const req = new NextRequest('http://localhost/api/admin/wms/pick-lists', {
      method: 'POST',
      body: JSON.stringify({ orderIds: ['o1'], warehouseId: 'wh1' }),
    })
    const res = await createPickList(req)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json).toHaveProperty('optimization')
  })

  it('POST rejects empty orderIds', async () => {
    const req = new NextRequest('http://localhost/api/admin/wms/pick-lists', {
      method: 'POST',
      body: JSON.stringify({ orderIds: [] }),
    })
    const res = await createPickList(req)
    expect(res.status).toBe(400)
  })
})

describe('WMS Pack API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('POST confirms packing with label generation', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      id: 'o1', orderNumber: 'ORD-001', shippingName: 'John', shippingAddress1: '123 St',
      shippingCity: 'Chennai', shippingState: 'TN', shippingZip: '600001', shippingPhone: '9876543210',
      paymentMethod: 'cod', total: 1500,
    } as any)
    mockPrisma.packSession.create.mockResolvedValue({ id: 'ps1', status: 'packed', items: [] } as any)

    const req = new NextRequest('http://localhost/api/admin/wms/pack', {
      method: 'POST',
      body: JSON.stringify({
        orderId: 'o1', weight: 500, length: 30, width: 20, height: 10,
        items: [{ variantId: 'v1', quantity: 2, verified: true }],
        courierName: 'Delhivery', trackingNumber: 'DLV123',
      }),
    })
    const res = await confirmPack(req)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json).toHaveProperty('shippingLabel')
    expect(json.shippingLabel.metadata.cod).toBe('₹1500')
  })

  it('POST rejects unverified items', async () => {
    const req = new NextRequest('http://localhost/api/admin/wms/pack', {
      method: 'POST',
      body: JSON.stringify({
        orderId: 'o1', weight: 500, length: 30, width: 20, height: 10,
        items: [{ variantId: 'v1', quantity: 1, verified: false }],
      }),
    })
    const res = await confirmPack(req)
    expect(res.status).toBe(400)
  })

  it('POST rejects missing orderId', async () => {
    const req = new NextRequest('http://localhost/api/admin/wms/pack', {
      method: 'POST',
      body: JSON.stringify({ items: [] }),
    })
    const res = await confirmPack(req)
    expect(res.status).toBe(400)
  })
})

describe('WMS Cycle Counts API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('GET returns cycle counts', async () => {
    mockPrisma.cycleCount.findMany.mockResolvedValue([{ id: 'cc1', status: 'scheduled' }] as any)

    const req = new NextRequest('http://localhost/api/admin/wms/cycle-counts')
    const res = await getCycleCounts(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.cycleCounts).toHaveLength(1)
  })

  it('POST schedules a cycle count', async () => {
    mockPrisma.cycleCount.create.mockResolvedValue({ id: 'cc-new', status: 'scheduled' } as any)

    const req = new NextRequest('http://localhost/api/admin/wms/cycle-counts', {
      method: 'POST',
      body: JSON.stringify({ warehouseId: 'wh1', scheduledAt: '2026-07-01T10:00:00Z' }),
    })
    const res = await scheduleCycleCount(req)
    expect(res.status).toBe(201)
  })

  it('POST rejects missing fields', async () => {
    const req = new NextRequest('http://localhost/api/admin/wms/cycle-counts', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await scheduleCycleCount(req)
    expect(res.status).toBe(400)
  })
})
