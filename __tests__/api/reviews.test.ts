import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { POST, GET } from '@/app/api/reviews/route'
import { prisma } from '@/lib/prisma'
import { requireAuthenticatedUser } from '@/lib/auth-middleware'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: { findUnique: vi.fn() },
    review: { findUnique: vi.fn(), create: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    orderItem: { findFirst: vi.fn() },
  },
}))
vi.mock('@/lib/auth-middleware', () => ({ requireAuthenticatedUser: vi.fn() }))

const AUTH_CTX = { authUser: { id: 'user-1' }, dbUser: { id: 'db-1' }, role: 'customer' }
const MOCK_PRODUCT = { id: 'p1', name: 'Pot', slug: 'pot' }

describe('Reviews API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAuthenticatedUser).mockResolvedValue(AUTH_CTX as any)
  })

  // ─── POST /api/reviews ────────────────────────────────────────────────────
  describe('POST /api/reviews', () => {
    it('creates a review successfully', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(MOCK_PRODUCT as any)
      vi.mocked(prisma.review.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.orderItem.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.review.create).mockResolvedValue({ id: 'r1', rating: 5 } as any)
      const req = new NextRequest('http://localhost/api/reviews', {
        method: 'POST',
        body: JSON.stringify({ productId: 'p1', rating: 5, title: 'Great', comment: 'Love it' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(201)
    })

    it('marks review as verified for purchased product', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(MOCK_PRODUCT as any)
      vi.mocked(prisma.review.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.orderItem.findFirst).mockResolvedValue({ id: 'oi-1' } as any)
      vi.mocked(prisma.review.create).mockResolvedValue({ id: 'r1', isVerified: true } as any)
      const req = new NextRequest('http://localhost/api/reviews', {
        method: 'POST',
        body: JSON.stringify({ productId: 'p1', rating: 4 }),
      })
      await POST(req)
      expect(prisma.review.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ isVerified: true }) })
      )
    })

    it('returns 400 for duplicate review', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(MOCK_PRODUCT as any)
      vi.mocked(prisma.review.findUnique).mockResolvedValue({ id: 'r-existing' } as any)
      const req = new NextRequest('http://localhost/api/reviews', {
        method: 'POST',
        body: JSON.stringify({ productId: 'p1', rating: 3 }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
      expect((await res.json()).error).toMatch(/already reviewed/)
    })

    it('returns 400 for rating below 1', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(MOCK_PRODUCT as any)
      const req = new NextRequest('http://localhost/api/reviews', {
        method: 'POST',
        body: JSON.stringify({ productId: 'p1', rating: 0 }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('returns 400 for rating above 5', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(MOCK_PRODUCT as any)
      const req = new NextRequest('http://localhost/api/reviews', {
        method: 'POST',
        body: JSON.stringify({ productId: 'p1', rating: 6 }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('returns 404 for non-existent product', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null)
      const req = new NextRequest('http://localhost/api/reviews', {
        method: 'POST',
        body: JSON.stringify({ productId: 'bad-id', rating: 4 }),
      })
      const res = await POST(req)
      expect(res.status).toBe(404)
    })

    it('returns 400 when productId and productSlug are both missing', async () => {
      const req = new NextRequest('http://localhost/api/reviews', {
        method: 'POST',
        body: JSON.stringify({ rating: 4 }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('returns 401 for unauthenticated user', async () => {
      vi.mocked(requireAuthenticatedUser).mockResolvedValue(
        NextResponse.json({ error: 'Authentication required' }, { status: 401 }) as any
      )
      const req = new NextRequest('http://localhost/api/reviews', {
        method: 'POST',
        body: JSON.stringify({ productId: 'p1', rating: 4 }),
      })
      const res = await POST(req)
      expect(res.status).toBe(401)
    })

    it('looks up product by slug when productSlug is provided', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(MOCK_PRODUCT as any)
      vi.mocked(prisma.review.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.orderItem.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.review.create).mockResolvedValue({ id: 'r2' } as any)
      const req = new NextRequest('http://localhost/api/reviews', {
        method: 'POST',
        body: JSON.stringify({ productSlug: 'pot', rating: 5 }),
      })
      const res = await POST(req)
      expect(res.status).toBe(201)
    })
  })

  // ─── GET /api/reviews ─────────────────────────────────────────────────────
  describe('GET /api/reviews', () => {
    it('returns reviews for authenticated user', async () => {
      vi.mocked(prisma.review.findMany).mockResolvedValue([{ id: 'r1' }] as any)
      vi.mocked(prisma.review.count).mockResolvedValue(1)
      const req = new NextRequest('http://localhost/api/reviews')
      const res = await GET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.reviews).toHaveLength(1)
      expect(json.pagination).toBeDefined()
    })

    it('allows admin to view any user reviews', async () => {
      vi.mocked(requireAuthenticatedUser).mockResolvedValue({
        ...AUTH_CTX, role: 'admin', dbUser: { id: 'admin-db' },
      } as any)
      vi.mocked(prisma.review.findMany).mockResolvedValue([])
      vi.mocked(prisma.review.count).mockResolvedValue(0)
      const req = new NextRequest('http://localhost/api/reviews?userId=other-user')
      const res = await GET(req)
      expect(res.status).toBe(200)
    })

    it('returns 401 for unauthenticated user', async () => {
      vi.mocked(requireAuthenticatedUser).mockResolvedValue(
        NextResponse.json({ error: 'Authentication required' }, { status: 401 }) as any
      )
      const req = new NextRequest('http://localhost/api/reviews')
      const res = await GET(req)
      expect(res.status).toBe(401)
    })
  })
})
