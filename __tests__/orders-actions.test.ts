import { describe, it, expect, vi, beforeEach } from 'vitest'
import { requestCancellation, requestReturn } from '@/lib/actions/orders'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: { findUnique: vi.fn(), update: vi.fn() },
    orderEvent: { create: vi.fn() },
    product: { update: vi.fn() },
    productVariant: { update: vi.fn() },
    $transaction: vi.fn(),
  },
}))
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const MOCK_USER = { id: 'user-1' }
const MOCK_ORDER_PENDING = {
  id: 'ord-1', userId: 'user-1', status: 'pending',
  orderItems: [{ id: 'oi-1', productId: 'p1', productVariantId: null, quantity: 2 }],
}
const MOCK_ORDER_DELIVERED = {
  id: 'ord-2', userId: 'user-1', status: 'delivered',
  deliveredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  orderItems: [],
}

describe('Order Actions', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: MOCK_USER } }) } }
    vi.mocked(createClient).mockResolvedValue(mockSupabase)
  })

  // ─── requestCancellation ──────────────────────────────────────────────────
  describe('requestCancellation', () => {
    it('cancels a pending order successfully', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(MOCK_ORDER_PENDING as any)
      vi.mocked(prisma.$transaction).mockResolvedValue(undefined as any)
      const result = await requestCancellation('ord-1', 'Changed my mind')
      expect(result.success).toBe(true)
      expect(prisma.$transaction).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalledWith('/orders/ord-1')
    })

    it('returns error when unauthenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const result = await requestCancellation('ord-1', 'reason')
      expect(result.error).toBe('Unauthorized')
    })

    it('returns error when order not found', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null)
      const result = await requestCancellation('bad-id', 'reason')
      expect(result.error).toBe('Order not found')
    })

    it('returns error when order belongs to different user', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({ ...MOCK_ORDER_PENDING, userId: 'other-user' } as any)
      const result = await requestCancellation('ord-1', 'reason')
      expect(result.error).toBe('Order not found')
    })

    it('returns error when order is already shipped', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({ ...MOCK_ORDER_PENDING, status: 'shipped' } as any)
      const result = await requestCancellation('ord-1', 'reason')
      expect(result.error).toMatch(/already shipped/)
    })

    it('returns error when order is already delivered', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({ ...MOCK_ORDER_PENDING, status: 'delivered' } as any)
      const result = await requestCancellation('ord-1', 'reason')
      expect(result.error).toMatch(/already delivered/)
    })

    it('returns error when order is already cancelled', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({ ...MOCK_ORDER_PENDING, status: 'cancelled' } as any)
      const result = await requestCancellation('ord-1', 'reason')
      expect(result.error).toMatch(/already cancelled/)
    })
  })

  // ─── requestReturn ────────────────────────────────────────────────────────
  describe('requestReturn', () => {
    it('requests return for delivered order within window', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(MOCK_ORDER_DELIVERED as any)
      vi.mocked(prisma.$transaction).mockResolvedValue(undefined as any)
      const result = await requestReturn('ord-2', 'Defective product')
      expect(result.success).toBe(true)
    })

    it('returns error when unauthenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const result = await requestReturn('ord-2', 'reason')
      expect(result.error).toBe('Unauthorized')
    })

    it('returns error when order not found', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null)
      const result = await requestReturn('bad-id', 'reason')
      expect(result.error).toBe('Order not found')
    })

    it('returns error when order is not delivered', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({ ...MOCK_ORDER_DELIVERED, status: 'shipped' } as any)
      const result = await requestReturn('ord-2', 'reason')
      expect(result.error).toMatch(/Only delivered orders/)
    })

    it('returns error when return window has expired (>7 days)', async () => {
      const oldDelivery = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        ...MOCK_ORDER_DELIVERED, deliveredAt: oldDelivery,
      } as any)
      const result = await requestReturn('ord-2', 'reason')
      expect(result.error).toMatch(/Return window/)
    })

    it('returns error when order belongs to different user', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({ ...MOCK_ORDER_DELIVERED, userId: 'other-user' } as any)
      const result = await requestReturn('ord-2', 'reason')
      expect(result.error).toBe('Order not found')
    })
  })
})
