import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTicket, replyToTicket } from '@/lib/actions/support'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    supportTicket: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    supportMessage: { create: vi.fn() },
    adminUser: { findUnique: vi.fn() },
  },
}))
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

describe('support actions', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = { auth: { getUser: vi.fn() } }
    vi.mocked(createClient).mockResolvedValue(mockSupabase)
  })

  // ─── createTicket ─────────────────────────────────────────────────────────
  describe('createTicket', () => {
    it('creates a ticket successfully for authenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
      vi.mocked(prisma.supportTicket.create).mockResolvedValue({ id: 'tkt-1' } as any)
      const result = await createTicket({ subject: 'Issue', category: 'Billing', message: 'Help' })
      expect(result.success).toBe(true)
      expect(result.ticketId).toBe('tkt-1')
      expect(revalidatePath).toHaveBeenCalledWith('/support')
    })

    it('returns error when not logged in', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const result = await createTicket({ subject: 'Issue', category: 'Billing', message: 'Help' })
      expect(result.error).toBe('You must be logged in to create a ticket.')
    })

    it('creates ticket with optional orderId and productId', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u2' } } })
      vi.mocked(prisma.supportTicket.create).mockResolvedValue({ id: 'tkt-2' } as any)
      const result = await createTicket({
        subject: 'Order Issue',
        category: 'Orders',
        message: 'Where is my order?',
        orderId: 'ord-1',
        productId: 'prod-1',
        priority: 'high',
      })
      expect(result.success).toBe(true)
      expect(prisma.supportTicket.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ orderId: 'ord-1', productId: 'prod-1', priority: 'high' }),
        })
      )
    })

    it('defaults priority to medium when not provided', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u3' } } })
      vi.mocked(prisma.supportTicket.create).mockResolvedValue({ id: 'tkt-3' } as any)
      await createTicket({ subject: 'S', category: 'C', message: 'M' })
      expect(prisma.supportTicket.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ priority: 'medium' }) })
      )
    })

    it('returns error on prisma failure', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u4' } } })
      vi.mocked(prisma.supportTicket.create).mockRejectedValue(new Error('DB error'))
      const result = await createTicket({ subject: 'S', category: 'C', message: 'M' })
      expect(result.error).toBeDefined()
    })
  })

  // ─── replyToTicket ────────────────────────────────────────────────────────
  describe('replyToTicket', () => {
    it('allows ticket owner to reply', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
      vi.mocked(prisma.supportTicket.findUnique).mockResolvedValue({
        id: 'tkt-1', userId: 'u1', status: 'open',
      } as any)
      vi.mocked(prisma.supportMessage.create).mockResolvedValue({} as any)
      vi.mocked(prisma.supportTicket.update).mockResolvedValue({} as any)
      const result = await replyToTicket('tkt-1', 'My reply')
      expect(result.success).toBe(true)
    })

    it('allows admin to reply to any ticket', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'admin-1' } } })
      vi.mocked(prisma.supportTicket.findUnique).mockResolvedValue({
        id: 'tkt-1', userId: 'other-user', status: 'open',
      } as any)
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue({ id: 'admin-1' } as any)
      vi.mocked(prisma.supportMessage.create).mockResolvedValue({} as any)
      vi.mocked(prisma.supportTicket.update).mockResolvedValue({} as any)
      const result = await replyToTicket('tkt-1', 'Admin reply')
      expect(result.success).toBe(true)
    })

    it('denies non-owner non-admin user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u2' } } })
      vi.mocked(prisma.supportTicket.findUnique).mockResolvedValue({
        id: 'tkt-1', userId: 'u1',
      } as any)
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue(null)
      const result = await replyToTicket('tkt-1', 'Unauthorized reply')
      expect(result.error).toBe('Unauthorized')
    })

    it('returns error when ticket not found', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
      vi.mocked(prisma.supportTicket.findUnique).mockResolvedValue(null)
      const result = await replyToTicket('nonexistent', 'Reply')
      expect(result.error).toBe('Ticket not found')
    })

    it('returns error when not logged in', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const result = await replyToTicket('tkt-1', 'Reply')
      expect(result.error).toBe('Unauthorized')
    })

    it('reopens resolved ticket on reply', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
      vi.mocked(prisma.supportTicket.findUnique).mockResolvedValue({
        id: 'tkt-1', userId: 'u1', status: 'resolved',
      } as any)
      vi.mocked(prisma.supportMessage.create).mockResolvedValue({} as any)
      vi.mocked(prisma.supportTicket.update).mockResolvedValue({} as any)
      await replyToTicket('tkt-1', 'Follow up')
      expect(prisma.supportTicket.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'open' }) })
      )
    })
  })
})
