import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        lowStockThreshold: true,
        isActive: true,
        colors: {
          select: {
            colorName: true,
            variants: {
              select: {
                id: true,
                size: true,
                stock: true,
                isActive: true,
              },
            },
          },
        },
      },
    })

    const lowStockVariants = products.flatMap((product) =>
      product.colors.flatMap((color) =>
        color.variants
          .filter((variant) => variant.isActive && variant.stock <= product.lowStockThreshold)
          .map((variant) => ({
            productId: product.id,
            productName: product.name,
            colorName: color.colorName,
            size: variant.size || 'Size',
            stock: variant.stock,
            threshold: product.lowStockThreshold,
            status: variant.stock <= 0 ? 'out' : 'low',
          }))
      )
    )

    console.log('[inventory] replenish scan', {
      checkedAt: new Date().toISOString(),
      totalVariants: products.reduce(
        (sum, product) => sum + product.colors.reduce((colorSum, color) => colorSum + color.variants.length, 0),
        0
      ),
      lowStockVariants: lowStockVariants.length,
    })

    return NextResponse.json({
      checkedAt: new Date().toISOString(),
      totalVariants: products.reduce(
        (sum, product) => sum + product.colors.reduce((colorSum, color) => colorSum + color.variants.length, 0),
        0
      ),
      lowStockVariants,
    })
  } catch (error) {
    console.error('Error running inventory replenish scan:', error)
    return NextResponse.json({ error: 'Failed to run replenish scan' }, { status: 500 })
  }
}
