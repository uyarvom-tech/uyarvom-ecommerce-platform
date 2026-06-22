import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'

// GET /api/admin/products/[id]/variants - Get color groups and size variants for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params

    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        colors: {
          orderBy: { sortOrder: 'asc' },
          include: {
            images: {
              orderBy: { sortOrder: 'asc' },
            },
            variants: {
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
      colors: product.colors,
    })
  } catch (error) {
    console.error('Error fetching variants:', error)
    return NextResponse.json({ error: 'Failed to fetch variants' }, { status: 500 })
  }
}
