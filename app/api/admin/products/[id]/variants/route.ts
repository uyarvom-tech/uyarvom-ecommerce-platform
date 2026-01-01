import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/admin/products/[id]/variants - Get all variants for a product (admin endpoint)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const variants = await prisma.productVariant.findMany({
      where: {
        productId: id
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