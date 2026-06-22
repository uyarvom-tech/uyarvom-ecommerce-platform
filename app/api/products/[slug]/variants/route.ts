import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/products/[slug]/variants - Get colors, images, and active size variants for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const product = await prisma.product.findUnique({
      where: { slug },
      select: {
        id: true,
        colors: {
          orderBy: { sortOrder: 'asc' },
          include: {
            images: {
              orderBy: { sortOrder: 'asc' },
            },
            variants: {
              where: {
                isActive: true,
                stock: { gt: 0 },
              },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({
      productId: product.id,
      colors: product.colors.map((color) => ({
        id: color.id,
        colorName: color.colorName,
        colorCode: color.colorCode,
        images: color.images,
        variants: color.variants.map((variant) => ({
          id: variant.id,
          size: variant.size,
          price: variant.price,
          stock: variant.stock,
          sku: variant.sku,
          isActive: variant.isActive,
          sortOrder: variant.sortOrder,
        })),
      })),
    })
  } catch (error) {
    console.error('Error fetching variants:', error)
    return NextResponse.json({ error: 'Failed to fetch variants' }, { status: 500 })
  }
}
