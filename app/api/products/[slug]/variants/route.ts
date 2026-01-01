import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/products/[slug]/variants - Get all active variants for a product (public endpoint)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // First find the product by slug
    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const variants = await prisma.productVariant.findMany({
      where: {
        productId: product.id,
        isActive: true,
        stock: {
          gt: 0 // Only show variants with stock
        }
      },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: [
        { name: 'asc' },
        { sortOrder: 'asc' }
      ]
    })

    return NextResponse.json(variants)
  } catch (error) {
    console.error('Error fetching variants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch variants' },
      { status: 500 }
    )
  }
}