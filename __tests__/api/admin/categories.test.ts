import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { GET, POST, PUT } from '@/app/api/admin/categories/route'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    category: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))
vi.mock('@/lib/auth-middleware', () => ({ requireStaffAccess: vi.fn() }))

const STAFF_CTX = { authUser: { id: 'staff-1' }, role: 'staff' }

describe('Admin Categories API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireStaffAccess).mockResolvedValue(STAFF_CTX as any)
  })

  // ─── GET /api/admin/categories ────────────────────────────────────────────
  describe('GET', () => {
    it('returns categories list for staff', async () => {
      vi.mocked(prisma.category.findMany).mockResolvedValue([
        { id: 'c1', name: 'Cookware', _count: { productCategories: 5, children: 2 }, parent: null, children: [] },
      ] as any)
      const req = new NextRequest('http://localhost/api/admin/categories')
      const res = await GET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.categories).toHaveLength(1)
      expect(json.categories[0].productCount).toBe(5)
    })

    it('returns 403 for unauthorized user', async () => {
      vi.mocked(requireStaffAccess).mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 403 }) as any
      )
      const req = new NextRequest('http://localhost/api/admin/categories')
      const res = await GET(req)
      expect(res.status).toBe(403)
    })
  })

  // ─── POST /api/admin/categories ───────────────────────────────────────────
  describe('POST', () => {
    it('creates a root category successfully', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.category.create).mockResolvedValue({ id: 'c2', name: 'Bakeware', slug: 'bakeware' } as any)
      const req = new NextRequest('http://localhost/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name: 'Bakeware', slug: 'bakeware', isActive: true }),
      })
      const res = await POST(req)
      expect(res.status).toBe(201)
    })

    it('creates a sub-category under valid parent', async () => {
      vi.mocked(prisma.category.findUnique)
        .mockResolvedValueOnce(null) // slug check
        .mockResolvedValueOnce({ id: 'parent-1', parentId: null } as any) // parent check
      vi.mocked(prisma.category.create).mockResolvedValue({ id: 'c3', name: 'Pans', slug: 'pans' } as any)
      const req = new NextRequest('http://localhost/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name: 'Pans', slug: 'pans', parentId: 'parent-1', isActive: true }),
      })
      const res = await POST(req)
      expect(res.status).toBe(201)
    })

    it('returns 400 for duplicate slug', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue({ id: 'existing' } as any)
      const req = new NextRequest('http://localhost/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name: 'Cookware', slug: 'cookware' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
      expect((await res.json()).error).toMatch(/slug already exists/)
    })

    it('returns 400 when parent category not found', async () => {
      vi.mocked(prisma.category.findUnique)
        .mockResolvedValueOnce(null) // slug check
        .mockResolvedValueOnce(null) // parent not found
      const req = new NextRequest('http://localhost/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name: 'Sub', slug: 'sub', parentId: 'bad-parent' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
      expect((await res.json()).error).toMatch(/Parent category not found/)
    })

    it('returns 400 when trying to nest 3 levels deep', async () => {
      vi.mocked(prisma.category.findUnique)
        .mockResolvedValueOnce(null) // slug check
        .mockResolvedValueOnce({ id: 'parent-1', parentId: 'grandparent-1' } as any) // parent is already a sub-cat
      const req = new NextRequest('http://localhost/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name: 'Deep', slug: 'deep', parentId: 'parent-1' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
      expect((await res.json()).error).toMatch(/Maximum 2 levels/)
    })

    it('returns 403 for unauthorized user', async () => {
      vi.mocked(requireStaffAccess).mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 403 }) as any
      )
      const req = new NextRequest('http://localhost/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name: 'X', slug: 'x' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(403)
    })
  })

  // ─── PUT /api/admin/categories ────────────────────────────────────────────
  describe('PUT', () => {
    it('updates a category successfully', async () => {
      vi.mocked(prisma.category.findFirst).mockResolvedValue(null) // no slug conflict
      vi.mocked(prisma.category.update).mockResolvedValue({ id: 'c1', name: 'Updated' } as any)
      const req = new NextRequest('http://localhost/api/admin/categories', {
        method: 'PUT',
        body: JSON.stringify({ id: 'c1', name: 'Updated', slug: 'updated', isActive: true }),
      })
      const res = await PUT(req)
      expect(res.status).toBe(200)
    })

    it('returns 400 for duplicate slug on update', async () => {
      vi.mocked(prisma.category.findFirst).mockResolvedValue({ id: 'other-cat' } as any)
      const req = new NextRequest('http://localhost/api/admin/categories', {
        method: 'PUT',
        body: JSON.stringify({ id: 'c1', name: 'X', slug: 'existing-slug' }),
      })
      const res = await PUT(req)
      expect(res.status).toBe(400)
    })

    it('returns 400 when category is its own parent', async () => {
      vi.mocked(prisma.category.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.category.findUnique).mockResolvedValue({ id: 'c1', parentId: null } as any)
      const req = new NextRequest('http://localhost/api/admin/categories', {
        method: 'PUT',
        body: JSON.stringify({ id: 'c1', name: 'X', slug: 'x', parentId: 'c1' }),
      })
      const res = await PUT(req)
      expect(res.status).toBe(400)
      expect((await res.json()).error).toMatch(/own parent/)
    })

    it('returns 400 when moving parent category with children under another category', async () => {
      vi.mocked(prisma.category.findFirst).mockResolvedValue(null) // no slug conflict
      vi.mocked(prisma.category.findUnique).mockResolvedValue({ id: 'parent-2', parentId: null } as any)
      // findFirst for hasChildren check
      vi.mocked(prisma.category.findFirst)
        .mockResolvedValueOnce(null) // slug check
        .mockResolvedValueOnce({ id: 'child-1' } as any) // has children
      const req = new NextRequest('http://localhost/api/admin/categories', {
        method: 'PUT',
        body: JSON.stringify({ id: 'c1', name: 'X', slug: 'x', parentId: 'parent-2' }),
      })
      const res = await PUT(req)
      expect(res.status).toBe(400)
    })
  })
})
