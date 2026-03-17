import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createOrder } from '@/lib/actions/checkout'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { getSystemSetting } from '@/lib/settings'

vi.mock('@/lib/prisma', () => ({
    prisma: {
        cartItem: { findMany: vi.fn(), deleteMany: vi.fn() },
        order: { create: vi.fn(), update: vi.fn() },
        orderItem: { create: vi.fn() },
        orderEvent: { create: vi.fn() },
        product: { update: vi.fn() },
        productVariant: { update: vi.fn() },
        address: { findUnique: vi.fn() },
        $transaction: vi.fn()
    }
}))

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn()
}))

vi.mock('@/lib/settings', () => ({
    getSystemSetting: vi.fn()
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn()
}))

vi.mock('razorpay', () => {
    return {
        default: class {
            orders = { create: vi.fn() }
        }
    }
})

describe('Server Action: createOrder', () => {
    let mockSupabase: any;

    beforeEach(() => {
        vi.clearAllMocks()

        mockSupabase = {
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user', email: 'test@example.com' } } })
            }
        };
        vi.mocked(createClient).mockResolvedValue(mockSupabase);
        vi.mocked(getSystemSetting).mockResolvedValue("0");
    })

    it('rejects checkout with empty cart', async () => {
        vi.mocked(prisma.cartItem.findMany).mockResolvedValue([])

        const response = await createOrder({
            addressId: 'addr-1',
            paymentMethod: 'cod'
        })

        expect(response.error).toBe('Your cart is empty.')
    })

    it('rejects checkout if stock is insufficient during final validation', async () => {
        vi.mocked(prisma.cartItem.findMany).mockResolvedValue([
            {
                id: 'cart-1',
                productId: 'prod-1',
                productVariantId: null,
                quantity: 5,
                product: { id: 'prod-1', price: 100, stockQuantity: 2 },
                productVariant: null
            }
        ] as any)

        const response = await createOrder({
            addressId: 'addr-1',
            paymentMethod: 'cod'
        })

        expect(response.error).toMatch(/insufficient stock/)
    })

    it('creates COD order successfully via transaction', async () => {
        // Setup valid cart
        vi.mocked(prisma.cartItem.findMany).mockResolvedValue([
            {
                id: 'cart-1',
                productId: 'prod-1',
                productVariantId: null,
                quantity: 1,
                product: { id: 'prod-1', price: 1500, stockQuantity: 10 },
                productVariant: null
            }
        ] as any)

        // Setup valid address
        vi.mocked((prisma as any).address.findUnique).mockResolvedValue({
            id: 'addr-1',
            userId: 'test-user',
            fullName: 'John',
            phone: '123'
        } as any)

        // Mock transaction behavior safely
        vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
            // Return a simulated order draft context
            return {
                id: 'order-1',
                status: 'pending',
                paymentMethod: 'cod'
            }
        })

        const response = await createOrder({
            addressId: 'addr-1',
            paymentMethod: 'cod'
        })

        expect(prisma.$transaction).toHaveBeenCalled()
        expect(response.success).toBe(true)
        expect(response.orderId).toBe('order-1')
    })
})
