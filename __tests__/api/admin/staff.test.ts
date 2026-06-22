import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/admin/staff/route'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findMany: vi.fn(), create: vi.fn() },
    adminUser: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}))

// Mock supabase-server for admin user creation
vi.mock('@/lib/supabase-server', () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        createUser: vi.fn(),
      },
    },
  },
}))

describe('Admin Staff API', () => {
  beforeEach(() => vi.clearAllMocks())

  // ─── GET /api/admin/staff ─────────────────────────────────────────────────
  describe('GET', () => {
    it('returns list of staff members', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([
        { id: 'u1', email: 'staff@uyarvom.com', fullName: 'Staff One' },
      ] as any)
      const req = new NextRequest('http://localhost/api/admin/staff')
      const res = await GET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.staff).toHaveLength(1)
    })

    it('returns 500 on database error', async () => {
      vi.mocked(prisma.user.findMany).mockRejectedValue(new Error('DB error'))
      const req = new NextRequest('http://localhost/api/admin/staff')
      const res = await GET(req)
      expect(res.status).toBe(500)
    })
  })

  // ─── POST /api/admin/staff ────────────────────────────────────────────────
  describe('POST', () => {
    it('returns 400 when required fields are missing', async () => {
      const req = new NextRequest('http://localhost/api/admin/staff', {
        method: 'POST',
        body: JSON.stringify({ email: 'staff@uyarvom.com' }), // missing fullName, role, password
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
      expect((await res.json()).error).toMatch(/required/)
    })

    it('returns 400 for invalid email format', async () => {
      const req = new NextRequest('http://localhost/api/admin/staff', {
        method: 'POST',
        body: JSON.stringify({ email: 'not-an-email', fullName: 'Test', role: 'staff', password: 'pass123' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
      expect((await res.json()).error).toMatch(/Invalid email/)
    })

    it('returns 400 for invalid role', async () => {
      const req = new NextRequest('http://localhost/api/admin/staff', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@uyarvom.com', fullName: 'Test', role: 'superuser', password: 'pass123' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
      expect((await res.json()).error).toMatch(/Invalid role/)
    })

    it('returns 400 when supabase auth creation fails', async () => {
      const { supabaseAdmin } = await import('@/lib/supabase-server')
      vi.mocked(supabaseAdmin.auth.admin.createUser).mockResolvedValue({
        data: { user: null },
        error: { message: 'Email already registered' },
      } as any)
      const req = new NextRequest('http://localhost/api/admin/staff', {
        method: 'POST',
        body: JSON.stringify({ email: 'existing@uyarvom.com', fullName: 'Test', role: 'staff', password: 'pass123' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })
  })
})
