import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    vendor: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    purchaseOrder: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    purchaseOrderItem: { findMany: vi.fn(), update: vi.fn() },
    goodsReceipt: { create: vi.fn() },
    productVariant: { update: vi.fn() },
    stockAdjustment: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/auth-middleware', () => ({
  requireStaffAccess: vi.fn().mockResolvedValue({ userId: 'admin-1', role: 'admin' }),
}))

import { prisma } from '@/lib/prisma'
import { GET as getVendors, POST as createVendor } from '@/app/api/admin/vendors/route'
import { GET as getVendorDetail, PUT as updateVendor, DELETE as deleteVendor } from '@/app/api/admin/vendors/[id]/route'
import { GET as getPOs, POST as createPO } from '@/app/api/admin/purchase-orders/route'
import { GET as getPODetail, PUT as updatePO } from '@/app/api/admin/purchase-orders/[id]/route'

const mockPrisma = vi.mocked(prisma)

describe('Vendor CRUD API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('GET /api/admin/vendors returns paginated list', async () => {
    mockPrisma.vendor.findMany.mockResolvedValue([{ id: 'v1', name: 'Supplier A', code: 'VND-001' }] as any)
    mockPrisma.vendor.count.mockResolvedValue(1)

    const req = new NextRequest('http://localhost/api/admin/vendors')
    const res = await getVendors(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.vendors).toHaveLength(1)
  })

  it('POST /api/admin/vendors creates vendor', async () => {
    mockPrisma.vendor.findUnique.mockResolvedValue(null)
    mockPrisma.vendor.create.mockResolvedValue({ id: 'v-new', name: 'New Vendor', code: 'VND-002' } as any)

    const req = new NextRequest('http://localhost/api/admin/vendors', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Vendor', code: 'VND-002', city: 'Chennai' }),
    })
    const res = await createVendor(req)
    expect(res.status).toBe(201)
  })

  it('POST rejects duplicate code', async () => {
    mockPrisma.vendor.findUnique.mockResolvedValue({ id: 'existing' } as any)

    const req = new NextRequest('http://localhost/api/admin/vendors', {
      method: 'POST',
      body: JSON.stringify({ name: 'Dup', code: 'VND-001' }),
    })
    const res = await createVendor(req)
    expect(res.status).toBe(400)
  })

  it('POST rejects missing fields', async () => {
    const req = new NextRequest('http://localhost/api/admin/vendors', {
      method: 'POST',
      body: JSON.stringify({ name: '' }),
    })
    const res = await createVendor(req)
    expect(res.status).toBe(400)
  })

  it('GET /api/admin/vendors/[id] returns vendor with performance', async () => {
    mockPrisma.vendor.findUnique.mockResolvedValue({ id: 'v1', name: 'Vendor A', purchaseOrders: [], _count: { purchaseOrders: 5, goodsReceipts: 3 } } as any)
    mockPrisma.purchaseOrder.findMany.mockResolvedValue([])

    const req = new NextRequest('http://localhost/api/admin/vendors/v1')
    const res = await getVendorDetail(req, { params: Promise.resolve({ id: 'v1' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('performance')
  })

  it('GET returns 404 for non-existent vendor', async () => {
    mockPrisma.vendor.findUnique.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/admin/vendors/bad')
    const res = await getVendorDetail(req, { params: Promise.resolve({ id: 'bad' }) })
    expect(res.status).toBe(404)
  })

  it('PUT updates vendor', async () => {
    mockPrisma.vendor.update.mockResolvedValue({ id: 'v1', name: 'Updated' } as any)

    const req = new NextRequest('http://localhost/api/admin/vendors/v1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated' }),
    })
    const res = await updateVendor(req, { params: Promise.resolve({ id: 'v1' }) })
    expect(res.status).toBe(200)
  })

  it('DELETE deactivates vendor', async () => {
    mockPrisma.vendor.update.mockResolvedValue({ id: 'v1', isActive: false } as any)

    const req = new NextRequest('http://localhost/api/admin/vendors/v1', { method: 'DELETE' })
    const res = await deleteVendor(req, { params: Promise.resolve({ id: 'v1' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.message).toContain('deactivated')
  })
})

describe('Purchase Order API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('GET /api/admin/purchase-orders returns list', async () => {
    mockPrisma.purchaseOrder.findMany.mockResolvedValue([{ id: 'po1', poNumber: 'PO-2601-ABCD', status: 'draft' }] as any)
    mockPrisma.purchaseOrder.count.mockResolvedValue(1)

    const req = new NextRequest('http://localhost/api/admin/purchase-orders')
    const res = await getPOs(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.purchaseOrders).toHaveLength(1)
  })

  it('GET filters by status', async () => {
    mockPrisma.purchaseOrder.findMany.mockResolvedValue([])
    mockPrisma.purchaseOrder.count.mockResolvedValue(0)

    const req = new NextRequest('http://localhost/api/admin/purchase-orders?status=sent')
    await getPOs(req)
    expect(mockPrisma.purchaseOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'sent' }) })
    )
  })

  it('POST creates PO with line items', async () => {
    mockPrisma.vendor.findUnique.mockResolvedValue({ id: 'v1' } as any)
    mockPrisma.purchaseOrder.create.mockResolvedValue({
      id: 'po-new', poNumber: 'PO-2606-TEST', status: 'draft',
      vendor: { name: 'Vendor', code: 'V1' }, lineItems: [],
    } as any)

    const req = new NextRequest('http://localhost/api/admin/purchase-orders', {
      method: 'POST',
      body: JSON.stringify({
        vendorId: 'v1',
        items: [{ variantId: 'var1', quantity: 10, unitPrice: 100 }],
      }),
    })
    const res = await createPO(req)
    expect(res.status).toBe(201)
  })

  it('POST rejects missing vendor', async () => {
    mockPrisma.vendor.findUnique.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/admin/purchase-orders', {
      method: 'POST',
      body: JSON.stringify({ vendorId: 'bad', items: [{ variantId: 'v', quantity: 1, unitPrice: 10 }] }),
    })
    const res = await createPO(req)
    expect(res.status).toBe(404)
  })

  it('POST rejects missing items', async () => {
    const req = new NextRequest('http://localhost/api/admin/purchase-orders', {
      method: 'POST',
      body: JSON.stringify({ vendorId: 'v1' }),
    })
    const res = await createPO(req)
    expect(res.status).toBe(400)
  })

  it('GET /api/admin/purchase-orders/[id] returns detail', async () => {
    mockPrisma.purchaseOrder.findUnique.mockResolvedValue({
      id: 'po1', poNumber: 'PO-001', vendor: {}, lineItems: [], goodsReceipts: [],
    } as any)

    const req = new NextRequest('http://localhost/api/admin/purchase-orders/po1')
    const res = await getPODetail(req, { params: Promise.resolve({ id: 'po1' }) })
    expect(res.status).toBe(200)
  })

  it('PUT updates PO status', async () => {
    mockPrisma.purchaseOrder.findUnique.mockResolvedValue({ status: 'draft' } as any)
    mockPrisma.purchaseOrder.update.mockResolvedValue({ status: 'approved' } as any)

    const req = new NextRequest('http://localhost/api/admin/purchase-orders/po1', {
      method: 'PUT',
      body: JSON.stringify({ status: 'approved' }),
    })
    const res = await updatePO(req, { params: Promise.resolve({ id: 'po1' }) })
    expect(res.status).toBe(200)
  })

  it('PUT rejects invalid PO transition', async () => {
    mockPrisma.purchaseOrder.findUnique.mockResolvedValue({ status: 'invoiced' } as any)

    const req = new NextRequest('http://localhost/api/admin/purchase-orders/po1', {
      method: 'PUT',
      body: JSON.stringify({ status: 'draft' }),
    })
    const res = await updatePO(req, { params: Promise.resolve({ id: 'po1' }) })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('Cannot transition')
  })
})
