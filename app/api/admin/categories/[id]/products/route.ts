import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get products that belong to this category
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        productCategories: {
          some: {
            categoryId: id
          }
        }
      },
      include: {
        productCategories: {
          include: {
            category: true
          }
        },
        images: {
          orderBy: {
            sortOrder: 'asc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Transform the data to match the expected format
    const transformedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku || '',
      price: product.price,
      stockQuantity: product.stockQuantity,
      isActive: product.isActive,
      categories: product.productCategories.map(pc => ({
        id: pc.category.id,
        name: pc.category.name
      })),
      images: product.images.map(img => ({
        imageUrl: img.imageUrl,
        isPrimary: img.sortOrder === 0
      }))
    }))

    return NextResponse.json(transformedProducts)
  } catch (error) {
    console.error('Error fetching category products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}