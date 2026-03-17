import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { POST, PUT } from '@/app/api/admin/products/route'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'

vi.mock('@/lib/prisma', () => ({
    prisma: {
        product: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
        productVariant: { deleteMany: vi.fn(), create: vi.fn() },
        productVariantImage: { createMany: vi.fn() },
        systemSetting: { findFirst: vi.fn() },
        category: { findUnique: vi.fn() }
    }
}))

vi.mock('@/lib/auth-middleware', () => ({
    requireStaffAccess: vi.fn()
}))

describe('Admin Products API', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(requireStaffAccess).mockResolvedValue({
            authUser: { id: 'admin-id' }
        } as any)
    })

    it('rejects product creation for non-admins', async () => {
        // Override standard mock to return unauthorized
        vi.mocked(requireStaffAccess).mockResolvedValue(
            NextResponse.json({ error: "Unauthorized" }, { status: 403 }) as any
        )

        const req = new NextRequest('http://localhost:3000/api/admin/products', {
            method: 'POST',
            body: JSON.stringify({ name: 'New Vase', slug: 'new-vase' })
        })

        const response = await POST(req)
        expect(response.status).toBe(403)
    })

    it('allows admins to update products and handle variant price/stock overrides', async () => {
        vi.mocked(prisma.product.update).mockResolvedValue({
            id: 'prod-1',
            productCategories: [],
            images: []
        } as any)
        vi.mocked(prisma.productVariant.deleteMany).mockResolvedValue({ count: 1 } as any)
        vi.mocked(prisma.productVariant.create).mockResolvedValue({ id: 'var-1' } as any)
        vi.mocked(prisma.product.findFirst).mockResolvedValue(null)

        const req = new NextRequest('http://localhost:3000/api/admin/products', {
            method: 'PUT',
            body: JSON.stringify({
                id: 'prod-1',
                categoryIds: ['cat-1'],
                hasColorVariants: true,
                colorVariants: [
                    {
                        colorName: 'Terracotta',
                        colorCode: '#E2725B',
                        stock: '50',
                        sku: 'VASE-TC-1',
                        price: '1999',
                        images: []
                    }
                ]
            })
        })

        const response = await PUT(req)
        expect(response.status).toBe(200)

        // Verify variants were recreated with new data
        expect(prisma.productVariant.deleteMany).toHaveBeenCalled()
        expect(prisma.productVariant.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                productId: 'prod-1',
                value: 'Terracotta',
                stock: 50,
                sku: 'VASE-TC-1',
                price: 1999
            })
        })
    })
})
