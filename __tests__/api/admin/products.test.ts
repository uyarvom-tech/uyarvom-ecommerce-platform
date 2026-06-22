import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { POST, PUT } from '@/app/api/admin/products/route'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
    productVariant: { deleteMany: vi.fn(), create: vi.fn() },
    productVariantImage: { createMany: vi.fn() },
    systemSetting: { findFirst: vi.fn() },
    category: { findUnique: vi.fn() },
  },
}))
vi.mock('@/lib/auth-middleware', () => ({ requireStaffAccess: vi.fn() }))

const STAFF_CTX = { authUser: { id: 'staff-1' }, role: 'staff' }

describe('Admin Products API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireStaffAccess).mockResolvedValue(STAFF_CTX as any)
  })

  // ─── POST /api/admin/products ─────────────────────────────────────────────
  describe('POST /api/admin/products', () => {
    it('returns 403 for unauthorized user', async () => {
      vi.mocked(requireStaffAccess).mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 403 }) as any
      )
      const req = new NextRequest('http://localhost/api/admin/products', {
        method: 'POST',
        body: JSON.stringify({ name: 'Vase', slug: 'vase' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(403)
    })

    it('returns 401 for unauthenticated user', async () => {
      vi.mocked(requireStaffAccess).mockResolvedValue(
        NextResponse.json({ error: 'Authentication required' }, { status: 401 }) as any
      )
      const req = new NextRequest('http://localhost/api/admin/products', {
        method: 'POST',
        body: JSON.stringify({ name: 'Vase', slug: 'vase' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(401)
    })
  })

  // ─── PUT /api/admin/products ──────────────────────────────────────────────
  describe('PUT /api/admin/products', () => {
    it('updates product and recreates variants', async () => {
      vi.mocked(prisma.product.update).mockResolvedValue({ id: 'p1', productCategories: [], images: [] } as any)
      vi.mocked(prisma.productVariant.deleteMany).mockResolvedValue({ count: 1 } as any)
      vi.mocked(prisma.productVariant.create).mockResolvedValue({ id: 'v1' } as any)
      vi.mocked(prisma.product.findFirst).mockResolvedValue(null)
      const req = new NextRequest('http://localhost/api/admin/products', {
        method: 'PUT',
        body: JSON.stringify({
          id: 'p1',
          categoryIds: ['cat-1'],
          hasColorVariants: true,
          colorVariants: [{ colorName: 'Red', colorCode: '#FF0000', stock: '10', sku: 'P1-R', price: '999', images: [] }],
        }),
      })
      const res = await PUT(req)
      expect(res.status).toBe(200)
      expect(prisma.productVariant.deleteMany).toHaveBeenCalled()
      expect(prisma.productVariant.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ productId: 'p1', value: 'Red', stock: 10, price: 999 }) })
      )
    })

    it('returns 403 for unauthorized user on PUT', async () => {
      vi.mocked(requireStaffAccess).mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 403 }) as any
      )
      const req = new NextRequest('http://localhost/api/admin/products', {
        method: 'PUT',
        body: JSON.stringify({ id: 'p1' }),
      })
      const res = await PUT(req)
      expect(res.status).toBe(403)
    })
  })
})
