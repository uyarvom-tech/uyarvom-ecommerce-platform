import { describe, it, expect, vi, beforeEach } from 'vitest'
import { assignTicket, updateTicketStatus } from '@/lib/actions/admin-support'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    adminUser: { findUnique: vi.fn() },
    supportTicket: { update: vi.fn() },
  },
}))
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

describe('admin-support actions', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = { auth: { getUser: vi.fn() } }
    vi.mocked(createClient).mockResolvedValue(mockSupabase)
  })

  // ─── assignTicket ─────────────────────────────────────────────────────────
  describe('assignTicket', () => {
    it('assigns ticket successfully for admin', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'admin-1' } } })
      vi.mocked((prisma as any).adminUser.findUnique).mockResolvedValue({ userId: 'admin-1' })
      vi.mocked((prisma as any).supportTicket.update).mockResolvedValue({})
      const result = await assignTicket('tkt-1')
      expect(result.success).toBe(true)
      expect((prisma as any).supportTicket.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'tkt-1' }, data: { assignedToId: 'admin-1' } })
      )
      expect(revalidatePath).toHaveBeenCalled()
    })

    it('returns error when not an admin', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
      vi.mocked((prisma as any).adminUser.findUnique).mockResolvedValue(null)
      const result = await assignTicket('tkt-1')
      expect(result.error).toBe('Unauthorized: Admin access required')
    })

    it('returns error when unauthenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const result = await assignTicket('tkt-1')
      expect(result.error).toBe('Unauthorized')
    })

    it('returns error on prisma failure', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'admin-1' } } })
      vi.mocked((prisma as any).adminUser.findUnique).mockResolvedValue({ userId: 'admin-1' })
      vi.mocked((prisma as any).supportTicket.update).mockRejectedValue(new Error('DB error'))
      const result = await assignTicket('tkt-1')
      expect(result.error).toBeDefined()
    })
  })

  // ─── updateTicketStatus ───────────────────────────────────────────────────
  describe('updateTicketStatus', () => {
    it('updates status to resolved for admin', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'admin-1' } } })
      vi.mocked((prisma as any).adminUser.findUnique).mockResolvedValue({ userId: 'admin-1' })
      vi.mocked((prisma as any).supportTicket.update).mockResolvedValue({})
      const result = await updateTicketStatus('tkt-1', 'resolved')
      expect(result.success).toBe(true)
      expect((prisma as any).supportTicket.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'tkt-1' }, data: { status: 'resolved' } })
      )
    })

    it('updates status to closed for admin', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'admin-1' } } })
      vi.mocked((prisma as any).adminUser.findUnique).mockResolvedValue({ userId: 'admin-1' })
      vi.mocked((prisma as any).supportTicket.update).mockResolvedValue({})
      const result = await updateTicketStatus('tkt-1', 'closed')
      expect(result.success).toBe(true)
    })

    it('returns error when not an admin', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
      vi.mocked((prisma as any).adminUser.findUnique).mockResolvedValue(null)
      const result = await updateTicketStatus('tkt-1', 'resolved')
      expect(result.error).toBe('Unauthorized: Admin access required')
    })

    it('returns error when unauthenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const result = await updateTicketStatus('tkt-1', 'resolved')
      expect(result.error).toBe('Unauthorized')
    })
  })
})
