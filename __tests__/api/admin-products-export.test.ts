import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth-middleware', () => ({
  requireStaffAccess: vi.fn().mockResolvedValue({ userId: 'admin-1', role: 'admin' }),
}))

import { prisma } from '@/lib/prisma'
import { GET } from '@/app/api/admin/products/export/route'

const mockPrisma = vi.mocked(prisma)

const mockProducts = [
  {
    id: 'p1',
    name: 'Ceramic Bowl',
    slug: 'ceramic-bowl',
    sku: 'UYV-BOWL-001',
    shortDescription: 'A nice bowl',
    description: 'A detailed description of a nice bowl',
    price: 599,
    compareAtPrice: 799,
    buyingPrice: 300,
    stockQuantity: 15,
    lowStockThreshold: 5,
    weight: 0.5,
    isActive: true,
    isFeatured: true,
    supplier: 'Supplier A',
    location: 'Chennai',
    moq: 10,
    bis: 'BIS-123',
    createdAt: new Date('2024-06-01'),
    productCategories: [
      {
        isPrimary: true,
        category: { id: 'c2', name: 'Bowls', parent: { id: 'c1', name: 'Dinnerware' } },
      },
    ],
    images: [{ imageUrl: 'https://cdn.uyarvom.com/bowl.jpg' }],
    colors: [
      {
        colorName: 'Natural',
        variants: [
          { stock: 10, sortOrder: 0 },
          { stock: 5, sortOrder: 1 },
        ],
      },
    ],
  },
]

describe('GET /api/admin/products/export', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.product.findMany.mockResolvedValue(mockProducts as any)
  })

  it('exports products as CSV by default', async () => {
    const req = new NextRequest('http://localhost/api/admin/products/export')
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('text/csv')
    expect(res.headers.get('Content-Disposition')).toContain('attachment')
    expect(res.headers.get('Content-Disposition')).toContain('.csv')

    const text = await res.text()
    expect(text).toContain('SKU,Name,Slug')
    expect(text).toContain('UYV-BOWL-001')
    expect(text).toContain('Ceramic Bowl')
  })

  it('exports products as JSON when format=json', async () => {
    const req = new NextRequest('http://localhost/api/admin/products/export?format=json')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('products')
    expect(json).toHaveProperty('count')
    expect(json.count).toBe(1)
  })

  it('filters by active status', async () => {
    const req = new NextRequest('http://localhost/api/admin/products/export?status=active')
    await GET(req)

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true }),
      })
    )
  })

  it('filters by inactive status', async () => {
    const req = new NextRequest('http://localhost/api/admin/products/export?status=inactive')
    await GET(req)

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: false }),
      })
    )
  })

  it('CSV properly escapes fields with commas', async () => {
    const productWithComma = [
      {
        ...mockProducts[0],
        description: 'A bowl, beautifully crafted',
      },
    ]
    mockPrisma.product.findMany.mockResolvedValue(productWithComma as any)

    const req = new NextRequest('http://localhost/api/admin/products/export')
    const res = await GET(req)
    const text = await res.text()

    expect(text).toContain('"A bowl, beautifully crafted"')
  })

  it('returns 500 on database error', async () => {
    mockPrisma.product.findMany.mockRejectedValue(new Error('DB error'))

    const req = new NextRequest('http://localhost/api/admin/products/export')
    const res = await GET(req)

    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('Failed to export products')
  })
})
