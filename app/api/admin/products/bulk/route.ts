import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-middleware'

// POST /api/admin/products/bulk - Bulk operations on products
export async function POST(request: NextRequest) {
  // Check admin access
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult // Return error response
  }

  try {
    const { action, productIds } = await request.json()

    if (!action || !productIds || !Array.isArray(productIds)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    let result

    switch (action) {
      case 'delete':
        result = await prisma.product.deleteMany({
          where: {
            id: { in: productIds }
          }
        })
        break

      case 'activate':
        result = await prisma.product.updateMany({
          where: {
            id: { in: productIds }
          },
          data: {
            isActive: true
          }
        })
        break

      case 'deactivate':
        result = await prisma.product.updateMany({
          where: {
            id: { in: productIds }
          },
          data: {
            isActive: false
          }
        })
        break

      case 'feature':
        result = await prisma.product.updateMany({
          where: {
            id: { in: productIds }
          },
          data: {
            isFeatured: true
          }
        })
        break

      case 'unfeature':
        result = await prisma.product.updateMany({
          where: {
            id: { in: productIds }
          },
          data: {
            isFeatured: false
          }
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      message: `Successfully ${action}d ${result.count} products`,
      count: result.count
    })
  } catch (error) {
    console.error('Error performing bulk operation:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    )
  }
}