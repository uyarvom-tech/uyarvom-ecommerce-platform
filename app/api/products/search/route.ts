import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/products/search - Search products by name, description, or category
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query.trim()) {
      return NextResponse.json({ products: [] })
    }

    // Search products by name, description, or category name
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
          { shortDescription: { contains: query } },
          { sku: { contains: query } },
          {
            productCategories: {
              some: {
                category: {
                  name: { contains: query }
                }
              }
            }
          }
        ]
      },
      include: {
        productCategories: {
          include: { category: true },
          orderBy: { isPrimary: 'desc' }
        },
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: [
        { isFeatured: 'desc' }, // Featured products first
        { createdAt: 'desc' }
      ],
      take: limit
    })

    // Transform products to include categories array
    const transformedProducts = products.map(product => ({
      ...product,
      categories: product.productCategories.map(pc => pc.category),
      primaryCategory: product.productCategories.find(pc => pc.isPrimary)?.category || product.productCategories[0]?.category
    }))

    return NextResponse.json({
      products: transformedProducts,
      query,
      count: transformedProducts.length
    })
  } catch (error) {
    console.error('Error searching products:', error)
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    )
  }
}