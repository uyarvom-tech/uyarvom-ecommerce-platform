import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// vi.mock must use inline factory without top-level variable references
vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    productCategory: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    productImage: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    productColor: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
    productVariant: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
      aggregate: vi.fn(),
    },
    category: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/auth-middleware', () => ({
  requireStaffAccess: vi.fn().mockResolvedValue({ userId: 'admin-1', role: 'admin' }),
  requireAdminRole: vi.fn().mockResolvedValue({ userId: 'admin-1', role: 'admin' }),
}))

import { prisma } from '@/lib/prisma'
import { GET } from '@/app/api/admin/products/route'
import { GET as GETSingle, DELETE } from '@/app/api/admin/products/[id]/route'

const mockPrisma = vi.mocked(prisma)

describe('GET /api/admin/products', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns paginated products list', async () => {
    const mockProducts = [
      {
        id: 'p1',
        name: 'Ceramic Bowl',
        slug: 'ceramic-bowl',
        price: 599,
        isActive: true,
        createdAt: new Date(),
        productCategories: [{ isPrimary: true, category: { id: 'c1', name: 'Dinnerware' } }],
        images: [],
        colors: [],
      },
    ]

    mockPrisma.product.findMany.mockResolvedValue(mockProducts as any)
    mockPrisma.product.count.mockResolvedValue(1)

    const req = new NextRequest('http://localhost/api/admin/products?page=1&limit=10')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('products')
    expect(json).toHaveProperty('pagination')
    expect(json.pagination.page).toBe(1)
    expect(json.pagination.total).toBe(1)
    expect(json.products).toHaveLength(1)
    expect(json.products[0].name).toBe('Ceramic Bowl')
  })

  it('applies search filter', async () => {
    mockPrisma.product.findMany.mockResolvedValue([])
    mockPrisma.product.count.mockResolvedValue(0)

    const req = new NextRequest('http://localhost/api/admin/products?search=bowl')
    await GET(req)

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { name: { contains: 'bowl' } },
            { sku: { contains: 'bowl' } },
          ]),
        }),
      })
    )
  })

  it('applies category filter', async () => {
    mockPrisma.product.findMany.mockResolvedValue([])
    mockPrisma.product.count.mockResolvedValue(0)

    const req = new NextRequest('http://localhost/api/admin/products?category=cat-123')
    await GET(req)

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          productCategories: { some: { categoryId: 'cat-123' } },
        }),
      })
    )
  })

  it('applies active status filter', async () => {
    mockPrisma.product.findMany.mockResolvedValue([])
    mockPrisma.product.count.mockResolvedValue(0)

    const req = new NextRequest('http://localhost/api/admin/products?status=active')
    await GET(req)

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true }),
      })
    )
  })

  it('applies inactive status filter', async () => {
    mockPrisma.product.findMany.mockResolvedValue([])
    mockPrisma.product.count.mockResolvedValue(0)

    const req = new NextRequest('http://localhost/api/admin/products?status=inactive')
    await GET(req)

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: false }),
      })
    )
  })

  it('handles pagination correctly', async () => {
    mockPrisma.product.findMany.mockResolvedValue([])
    mockPrisma.product.count.mockResolvedValue(25)

    const req = new NextRequest('http://localhost/api/admin/products?page=3&limit=5')
    const res = await GET(req)
    const json = await res.json()

    expect(json.pagination.page).toBe(3)
    expect(json.pagination.limit).toBe(5)
    expect(json.pagination.total).toBe(25)
    expect(json.pagination.pages).toBe(5)

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 5 })
    )
  })

  it('returns 500 on database error', async () => {
    mockPrisma.product.findMany.mockRejectedValue(new Error('DB connection failed'))

    const req = new NextRequest('http://localhost/api/admin/products')
    const res = await GET(req)

    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('Failed to fetch products')
  })
})

describe('GET /api/admin/products/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns single product with full details', async () => {
    const mockProduct = {
      id: 'p1',
      name: 'Ceramic Bowl',
      slug: 'ceramic-bowl',
      sku: 'UYV-BOWL-001',
      price: 599,
      isActive: true,
      productCategories: [{ isPrimary: true, categoryId: 'c1', category: { id: 'c1', name: 'Dinnerware' } }],
      images: [{ id: 'img1', imageUrl: '/test.jpg', isPrimary: true, sortOrder: 0 }],
      colors: [
        {
          id: 'col1',
          colorName: 'Natural',
          images: [],
          variants: [{ id: 'v1', size: 'Default', stock: 10 }],
        },
      ],
    }

    mockPrisma.product.findUnique.mockResolvedValue(mockProduct as any)

    const req = new NextRequest('http://localhost/api/admin/products/p1')
    const res = await GETSingle(req, { params: Promise.resolve({ id: 'p1' }) })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.id).toBe('p1')
    expect(json.name).toBe('Ceramic Bowl')
    expect(json.categories).toHaveLength(1)
    expect(json.categoryIds).toContain('c1')
  })

  it('returns 404 for non-existent product', async () => {
    mockPrisma.product.findUnique.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/admin/products/nonexistent')
    const res = await GETSingle(req, { params: Promise.resolve({ id: 'nonexistent' }) })

    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBe('Product not found')
  })
})

describe('DELETE /api/admin/products/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes a product successfully', async () => {
    mockPrisma.product.findUnique.mockResolvedValue({ id: 'p1', name: 'Test' } as any)
    mockPrisma.product.delete.mockResolvedValue({ id: 'p1' } as any)

    const req = new NextRequest('http://localhost/api/admin/products/p1', { method: 'DELETE' })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'p1' }) })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.message).toBe('Product deleted successfully')
  })

  it('returns 404 when product does not exist', async () => {
    mockPrisma.product.findUnique.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/admin/products/bad-id', { method: 'DELETE' })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'bad-id' }) })

    expect(res.status).toBe(404)
  })
})
