import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getVariantStockTotal } from '@/lib/variant-stock'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ products: [] })
    }

    const searchTerm = query.trim().toLowerCase()

    // Search products by name, SKU, or category
    const products = await prisma.product.findMany({
      where: {
        OR: [
          {
            name: {
              contains: searchTerm
            }
          },
          {
            sku: {
              contains: searchTerm
            }
          },
          {
            productCategories: {
              some: {
                category: {
                  name: {
                    contains: searchTerm
                  }
                }
              }
            }
          }
        ]
      },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' }
        },
        productCategories: {
          include: {
            category: true
          },
          orderBy: { isPrimary: 'desc' }
        },
        colors: {
          orderBy: { sortOrder: 'asc' },
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
            variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } }
          }
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { isFeatured: 'desc' },
        { name: 'asc' }
      ],
      take: 20 // Limit results for performance
    })

    // Transform the data to match the expected format
    const transformedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      stockQuantity: getVariantStockTotal(product as any),
      isActive: product.isActive,
      categories: product.productCategories.map(pc => ({
        id: pc.category.id,
        name: pc.category.name
      })),
      images: product.images,
      colors: product.colors
    }))

    return NextResponse.json({ products: transformedProducts })
  } catch (error) {
    console.error('Product search error:', error)
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    )
  }
}
