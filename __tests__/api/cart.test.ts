import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/cart/route'
import { prisma } from '@/lib/prisma'
import { requireAuthenticatedUser } from '@/lib/auth-middleware'
import { getDefaultVariant } from '@/lib/variant-stock'
import { NextResponse } from 'next/server'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: { findUnique: vi.fn() },
    productVariant: { findFirst: vi.fn() },
    cartItem: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
}))
vi.mock('@/lib/auth-middleware', () => ({ requireAuthenticatedUser: vi.fn() }))
vi.mock('@/lib/variant-stock', () => ({ getDefaultVariant: vi.fn() }))

const AUTH_CTX = { authUser: { id: 'user-1' }, dbUser: { id: 'db-1' }, role: 'customer' }

describe('Cart API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAuthenticatedUser).mockResolvedValue(AUTH_CTX as any)
  })

  // ─── GET /api/cart ────────────────────────────────────────────────────────
  describe('GET /api/cart', () => {
    it('returns cart items for authenticated user', async () => {
      vi.mocked(prisma.cartItem.findMany).mockResolvedValue([{ id: 'ci-1' }] as any)
      const req = new NextRequest('http://localhost/api/cart')
      const res = await GET(req)
      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.items).toHaveLength(1)
    })

    it('returns 401 for unauthenticated user', async () => {
      vi.mocked(requireAuthenticatedUser).mockResolvedValue(
        NextResponse.json({ error: 'Authentication required' }, { status: 401 }) as any
      )
      const req = new NextRequest('http://localhost/api/cart')
      const res = await GET(req)
      expect(res.status).toBe(401)
    })

    it('returns empty array when cart is empty', async () => {
      vi.mocked(prisma.cartItem.findMany).mockResolvedValue([])
      const req = new NextRequest('http://localhost/api/cart')
      const res = await GET(req)
      const json = await res.json()
      expect(json.items).toHaveLength(0)
    })
  })

  // ─── POST /api/cart ───────────────────────────────────────────────────────
  describe('POST /api/cart', () => {
    it('adds a product to cart using default variant (new item)', async () => {
      // Product with colors/variants structure
      const mockProduct = { id: 'p1', isActive: true, stockQuantity: 10, colors: [{ id: 'c1', variants: [{ id: 'v1', stock: 10, isActive: true, sortOrder: 0 }] }] }
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any)
      // getDefaultVariant returns the first active in-stock variant
      vi.mocked(getDefaultVariant).mockReturnValue({ id: 'v1', stock: 10, isActive: true })
      // productVariant.findFirst returns the full variant with product relation
      vi.mocked(prisma.productVariant.findFirst).mockResolvedValue({ id: 'v1', stock: 10, isActive: true, product: { isActive: true } } as any)
      vi.mocked(prisma.cartItem.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.cartItem.create).mockResolvedValue({ id: 'ci-1', productId: 'p1', productVariantId: 'v1', quantity: 1 } as any)

      const req = new NextRequest('http://localhost/api/cart', {
        method: 'POST',
        body: JSON.stringify({ productId: 'p1', quantity: 1 }),
      })
      const res = await POST(req)
      expect(res.status).toBe(201)
      expect((await res.json()).item).toBeDefined()
    })

    it('increments quantity for existing cart item', async () => {
      const mockProduct = { id: 'p1', isActive: true, stockQuantity: 10, colors: [{ id: 'c1', variants: [{ id: 'v1', stock: 10, isActive: true, sortOrder: 0 }] }] }
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any)
      vi.mocked(getDefaultVariant).mockReturnValue({ id: 'v1', stock: 10, isActive: true })
      vi.mocked(prisma.productVariant.findFirst).mockResolvedValue({ id: 'v1', stock: 10, isActive: true, product: { isActive: true } } as any)
      vi.mocked(prisma.cartItem.findFirst).mockResolvedValue({ id: 'ci-1', quantity: 2 } as any)
      vi.mocked(prisma.cartItem.update).mockResolvedValue({ id: 'ci-1', quantity: 3 } as any)

      const req = new NextRequest('http://localhost/api/cart', {
        method: 'POST',
        body: JSON.stringify({ productId: 'p1', quantity: 1 }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      expect(prisma.cartItem.update).toHaveBeenCalled()
    })

    it('rejects out-of-stock product (variant has 0 stock)', async () => {
      const mockProduct = { id: 'p1', isActive: true, stockQuantity: 0, colors: [{ id: 'c1', variants: [{ id: 'v1', stock: 0, isActive: true, sortOrder: 0 }] }] }
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any)
      vi.mocked(getDefaultVariant).mockReturnValue({ id: 'v1', stock: 0, isActive: true })
      vi.mocked(prisma.productVariant.findFirst).mockResolvedValue({ id: 'v1', stock: 0, isActive: true, product: { isActive: true } } as any)

      const req = new NextRequest('http://localhost/api/cart', {
        method: 'POST',
        body: JSON.stringify({ productId: 'p1', quantity: 1 }),
      })
      const res = await POST(req)
      expect(res.status).toBe(409)
      expect((await res.json()).error).toBe('Selection is out of stock')
    })

    it('rejects inactive product', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({ id: 'p1', isActive: false, stockQuantity: 10, colors: [] } as any)

      const req = new NextRequest('http://localhost/api/cart', {
        method: 'POST',
        body: JSON.stringify({ productId: 'p1', quantity: 1 }),
      })
      const res = await POST(req)
      expect(res.status).toBe(404)
    })

    it('rejects missing productId', async () => {
      const req = new NextRequest('http://localhost/api/cart', {
        method: 'POST',
        body: JSON.stringify({ quantity: 1 }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('adds a product variant to cart (explicit variantId)', async () => {
      const mockProduct = { id: 'p2', isActive: true, stockQuantity: 5, colors: [{ id: 'c1', variants: [{ id: 'v1', stock: 5, isActive: true, sortOrder: 0 }] }] }
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any)
      // When variantId is provided, productVariant.findFirst is called directly (getDefaultVariant not used)
      vi.mocked(prisma.productVariant.findFirst).mockResolvedValue({
        id: 'v1', isActive: true, stock: 5, product: { isActive: true }, color: { colorName: 'Red' },
      } as any)
      vi.mocked(prisma.cartItem.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.cartItem.create).mockResolvedValue({ id: 'ci-2', productVariantId: 'v1', quantity: 1 } as any)

      const req = new NextRequest('http://localhost/api/cart', {
        method: 'POST',
        body: JSON.stringify({ productId: 'p2', variantId: 'v1', quantity: 1 }),
      })
      const res = await POST(req)
      expect(res.status).toBe(201)
    })

    it('rejects out-of-stock variant', async () => {
      const mockProduct = { id: 'p2', isActive: true, stockQuantity: 0, colors: [{ id: 'c1', variants: [{ id: 'v1', stock: 0, isActive: true, sortOrder: 0 }] }] }
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any)
      vi.mocked(prisma.productVariant.findFirst).mockResolvedValue({
        id: 'v1', isActive: true, stock: 0, product: { isActive: true },
      } as any)

      const req = new NextRequest('http://localhost/api/cart', {
        method: 'POST',
        body: JSON.stringify({ productId: 'p2', variantId: 'v1', quantity: 1 }),
      })
      const res = await POST(req)
      expect(res.status).toBe(409)
    })

    it('rejects unavailable variant (not found)', async () => {
      const mockProduct = { id: 'p2', isActive: true, stockQuantity: 5, colors: [] }
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any)
      vi.mocked(prisma.productVariant.findFirst).mockResolvedValue(null)

      const req = new NextRequest('http://localhost/api/cart', {
        method: 'POST',
        body: JSON.stringify({ productId: 'p2', variantId: 'v-bad', quantity: 1 }),
      })
      const res = await POST(req)
      expect(res.status).toBe(404)
    })

    it('caps quantity at available stock', async () => {
      const mockProduct = { id: 'p1', isActive: true, stockQuantity: 3, colors: [{ id: 'c1', variants: [{ id: 'v1', stock: 3, isActive: true, sortOrder: 0 }] }] }
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any)
      vi.mocked(getDefaultVariant).mockReturnValue({ id: 'v1', stock: 3, isActive: true })
      vi.mocked(prisma.productVariant.findFirst).mockResolvedValue({ id: 'v1', stock: 3, isActive: true, product: { isActive: true } } as any)
      vi.mocked(prisma.cartItem.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.cartItem.create).mockResolvedValue({ id: 'ci-3', quantity: 3 } as any)

      const req = new NextRequest('http://localhost/api/cart', {
        method: 'POST',
        body: JSON.stringify({ productId: 'p1', quantity: 99 }),
      })
      const res = await POST(req)
      expect(res.status).toBe(201)
      expect(prisma.cartItem.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ quantity: 3 }) })
      )
    })

    it('returns 401 for unauthenticated user', async () => {
      vi.mocked(requireAuthenticatedUser).mockResolvedValue(
        NextResponse.json({ error: 'Authentication required' }, { status: 401 }) as any
      )
      const req = new NextRequest('http://localhost/api/cart', {
        method: 'POST',
        body: JSON.stringify({ productId: 'p1', quantity: 1 }),
      })
      const res = await POST(req)
      expect(res.status).toBe(401)
    })

    it('returns 404 when no default variant is available and no variantId provided', async () => {
      const mockProduct = { id: 'p1', isActive: true, stockQuantity: 0, colors: [] }
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any)
      vi.mocked(getDefaultVariant).mockReturnValue(null)

      const req = new NextRequest('http://localhost/api/cart', {
        method: 'POST',
        body: JSON.stringify({ productId: 'p1', quantity: 1 }),
      })
      const res = await POST(req)
      expect(res.status).toBe(404)
      expect((await res.json()).error).toBe('Please select a valid size variant')
    })
  })
})
