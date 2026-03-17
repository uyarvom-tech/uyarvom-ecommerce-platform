import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/cart/route'
import { prisma } from '@/lib/prisma'
import { requireAuthenticatedUser } from '@/lib/auth-middleware'

vi.mock('@/lib/prisma', () => ({
    prisma: {
        product: { findUnique: vi.fn() },
        productVariant: { findUnique: vi.fn() },
        cartItem: {
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn()
        }
    }
}))

vi.mock('@/lib/auth-middleware', () => ({
    requireAuthenticatedUser: vi.fn()
}))

describe('POST /api/cart', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(requireAuthenticatedUser).mockResolvedValue({
            authUser: { id: 'test-user-id' }
        } as any)
    })

    it('adds a base product to cart successfully', async () => {
        vi.mocked(prisma.product.findUnique).mockResolvedValue({
            id: 'prod-1',
            isActive: true,
            stockQuantity: 10
        } as any)

        vi.mocked(prisma.cartItem.findFirst).mockResolvedValue(null)
        vi.mocked(prisma.cartItem.create).mockResolvedValue({
            id: 'cart-1',
            productId: 'prod-1',
            quantity: 1
        } as any)

        const req = new NextRequest('http://localhost:3000/api/cart', {
            method: 'POST',
            body: JSON.stringify({ productId: 'prod-1', quantity: 1 })
        })

        const response = await POST(req)
        const json = await response.json()

        expect(response.status).toBe(201)
        expect(json.item).toBeDefined()
        expect(prisma.cartItem.create).toHaveBeenCalledWith({
            data: {
                userId: 'test-user-id',
                productId: 'prod-1',
                productVariantId: null,
                quantity: 1
            }
        })
    })

    it('rejects adding an out-of-stock product', async () => {
        vi.mocked(prisma.product.findUnique).mockResolvedValue({
            id: 'prod-1',
            isActive: true,
            stockQuantity: 0
        } as any)

        const req = new NextRequest('http://localhost:3000/api/cart', {
            method: 'POST',
            body: JSON.stringify({ productId: 'prod-1', quantity: 1 })
        })

        const response = await POST(req)
        expect(response.status).toBe(409)
        const json = await response.json()
        expect(json.error).toBe('Selection is out of stock')
    })

    it('adds a product variant successfully', async () => {
        vi.mocked(prisma.productVariant.findUnique).mockResolvedValue({
            id: 'var-1',
            isActive: true,
            stock: 5,
            product: { isActive: true }
        } as any)

        vi.mocked(prisma.cartItem.findFirst).mockResolvedValue(null)
        vi.mocked(prisma.cartItem.create).mockResolvedValue({
            id: 'cart-2',
            productId: 'prod-2',
            productVariantId: 'var-1',
            quantity: 2
        } as any)

        const req = new NextRequest('http://localhost:3000/api/cart', {
            method: 'POST',
            body: JSON.stringify({ productId: 'prod-2', variantId: 'var-1', quantity: 2 })
        })

        const response = await POST(req)
        expect(response.status).toBe(201)
        expect(prisma.cartItem.create).toHaveBeenCalledWith(expect.objectContaining({
            data: {
                userId: 'test-user-id',
                productId: 'prod-2',
                productVariantId: 'var-1',
                quantity: 2
            }
        }))
    })
})
