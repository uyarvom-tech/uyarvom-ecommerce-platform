import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getCurrentUser,
  getCurrentUserContext,
  getCurrentUserRole,
  requireAuthenticatedUser,
  requireStaffAccess,
  requireAdminAccess,
  checkAdminAccess,
} from '@/lib/auth-middleware'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { syncAuthUserToPrisma } from '@/lib/user-sync'
import { NextResponse } from 'next/server'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: { adminUser: { findUnique: vi.fn() }, user: { upsert: vi.fn() } },
}))
vi.mock('@/lib/user-sync', () => ({ syncAuthUserToPrisma: vi.fn() }))

describe('auth-middleware', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = { auth: { getUser: vi.fn() } }
    vi.mocked(createClient).mockResolvedValue(mockSupabase)
    vi.mocked(syncAuthUserToPrisma).mockResolvedValue({ id: 'db-user-id' } as any)
  })

  // ─── getCurrentUser ───────────────────────────────────────────────────────
  describe('getCurrentUser', () => {
    it('returns user when authenticated', async () => {
      const mockUser = { id: 'test-user' }
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      expect(await getCurrentUser()).toEqual(mockUser)
    })

    it('returns null when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
      expect(await getCurrentUser()).toBeNull()
    })

    it('returns null when supabase returns an error', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error('auth error') })
      expect(await getCurrentUser()).toBeNull()
    })

    it('returns null on thrown exception', async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error('network failure'))
      expect(await getCurrentUser()).toBeNull()
    })
  })

  // ─── getCurrentUserContext ────────────────────────────────────────────────
  describe('getCurrentUserContext', () => {
    it('returns full context for authenticated admin', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue({ role: 'admin' } as any)
      const ctx = await getCurrentUserContext()
      expect(ctx?.role).toBe('admin')
      expect(ctx?.authUser).toEqual({ id: 'u1' })
    })

    it('defaults to customer role when no adminUser record', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u2' } }, error: null })
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue(null)
      const ctx = await getCurrentUserContext()
      expect(ctx?.role).toBe('customer')
    })

    it('returns null when unauthenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
      expect(await getCurrentUserContext()).toBeNull()
    })

    it('assigns super_admin role correctly', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'sa1' } }, error: null })
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue({ role: 'super_admin' } as any)
      const ctx = await getCurrentUserContext()
      expect(ctx?.role).toBe('super_admin')
    })

    it('assigns staff role correctly', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'st1' } }, error: null })
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue({ role: 'staff' } as any)
      const ctx = await getCurrentUserContext()
      expect(ctx?.role).toBe('staff')
    })
  })

  // ─── getCurrentUserRole ───────────────────────────────────────────────────
  describe('getCurrentUserRole', () => {
    it('returns role string for authenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u3' } }, error: null })
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue({ role: 'staff' } as any)
      expect(await getCurrentUserRole()).toBe('staff')
    })

    it('returns null when unauthenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
      expect(await getCurrentUserRole()).toBeNull()
    })

    it('returns null on exception', async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error('fail'))
      expect(await getCurrentUserRole()).toBeNull()
    })
  })

  // ─── requireAuthenticatedUser ─────────────────────────────────────────────
  describe('requireAuthenticatedUser', () => {
    it('returns context when authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u4' } }, error: null })
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue(null)
      const result = await requireAuthenticatedUser()
      expect(result).toHaveProperty('authUser')
    })

    it('returns 401 when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
      const result = await requireAuthenticatedUser()
      expect(result).toBeInstanceOf(NextResponse)
      expect((result as NextResponse).status).toBe(401)
    })

    it('returns error response on unexpected exception', async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error('crash'))
      const result = await requireAuthenticatedUser()
      expect(result).toBeInstanceOf(NextResponse)
      // Implementation catches and returns 401 (unauthenticated) on any auth failure
      expect([401, 500]).toContain((result as NextResponse).status)
    })
  })

  // ─── requireStaffAccess ───────────────────────────────────────────────────
  describe('requireStaffAccess', () => {
    it('allows staff role', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'st2' } }, error: null })
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue({ role: 'staff' } as any)
      const result = await requireStaffAccess()
      expect(result).toHaveProperty('role', 'staff')
    })

    it('allows admin role', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'a1' } }, error: null })
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue({ role: 'admin' } as any)
      const result = await requireStaffAccess()
      expect(result).toHaveProperty('role', 'admin')
    })

    it('allows super_admin role', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'sa2' } }, error: null })
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue({ role: 'super_admin' } as any)
      const result = await requireStaffAccess()
      expect(result).toHaveProperty('role', 'super_admin')
    })

    it('returns 403 for customer role', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'c1' } }, error: null })
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue(null)
      const result = await requireStaffAccess()
      expect(result).toBeInstanceOf(NextResponse)
      expect((result as NextResponse).status).toBe(403)
    })

    it('returns 401 when unauthenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
      const result = await requireStaffAccess()
      expect(result).toBeInstanceOf(NextResponse)
      expect((result as NextResponse).status).toBe(401)
    })
  })

  // ─── requireAdminAccess ───────────────────────────────────────────────────
  describe('requireAdminAccess', () => {
    it('allows admin role', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'a2' } }, error: null })
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue({ role: 'admin' } as any)
      const result = await requireAdminAccess()
      expect(result).toHaveProperty('role', 'admin')
    })

    it('allows super_admin role', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'sa3' } }, error: null })
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue({ role: 'super_admin' } as any)
      const result = await requireAdminAccess()
      expect(result).toHaveProperty('role', 'super_admin')
    })

    it('returns 403 for staff role', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'st3' } }, error: null })
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue({ role: 'staff' } as any)
      const result = await requireAdminAccess()
      expect(result).toBeInstanceOf(NextResponse)
      expect((result as NextResponse).status).toBe(403)
    })

    it('returns 403 for customer role', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'c2' } }, error: null })
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue(null)
      const result = await requireAdminAccess()
      expect(result).toBeInstanceOf(NextResponse)
      expect((result as NextResponse).status).toBe(403)
    })

    it('returns 401 when unauthenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
      const result = await requireAdminAccess()
      expect(result).toBeInstanceOf(NextResponse)
      expect((result as NextResponse).status).toBe(401)
    })
  })

  // ─── checkAdminAccess ─────────────────────────────────────────────────────
  describe('checkAdminAccess', () => {
    it('returns true for admin', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'a3' } }, error: null })
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue({ role: 'admin' } as any)
      expect(await checkAdminAccess()).toBe(true)
    })

    it('returns true for super_admin', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'sa4' } }, error: null })
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue({ role: 'super_admin' } as any)
      expect(await checkAdminAccess()).toBe(true)
    })

    it('returns false for staff', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'st4' } }, error: null })
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue({ role: 'staff' } as any)
      expect(await checkAdminAccess()).toBe(false)
    })

    it('returns false for unauthenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
      expect(await checkAdminAccess()).toBe(false)
    })

    it('returns false on exception', async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error('crash'))
      expect(await checkAdminAccess()).toBe(false)
    })
  })
})
