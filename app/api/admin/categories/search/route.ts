import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'

// GET /api/admin/categories/search - Search categories by products
export async function GET(request: NextRequest) {
  // Check staff access (both admin and staff can search categories)
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult // Return error response
  }

  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    if (!query.trim()) {
      return NextResponse.json({ categories: [] })
    }

    // Search for categories that contain products matching the query
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          // Category name matches
          { name: { contains: query } },
          // Category description matches
          { description: { contains: query } },
          // Category has products that match
          {
            productCategories: {
              some: {
                product: {
                  OR: [
                    { name: { contains: query } },
                    { description: { contains: query } },
                    { sku: { contains: query } }
                  ]
                }
              }
            }
          }
        ]
      },
      include: {
        _count: {
          select: {
            productCategories: true
          }
        },
        productCategories: {
          where: {
            product: {
              OR: [
                { name: { contains: query } },
                { description: { contains: query } },
                { sku: { contains: query } }
              ]
            }
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true
              }
            }
          },
          take: 5 // Limit matching products shown
        }
      },
      orderBy: { name: 'asc' }
    })

    // Transform categories to include product count and matching products
    const transformedCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      displayOrder: category.displayOrder,
      isActive: category.isActive,
      productCount: category._count.productCategories,
      matchingProducts: category.productCategories.map(pc => pc.product)
    }))

    return NextResponse.json({ categories: transformedCategories })
  } catch (error) {
    console.error('Error searching categories:', error)
    return NextResponse.json(
      { error: 'Failed to search categories' },
      { status: 500 }
    )
  }
}