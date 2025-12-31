import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-middleware'

// POST /api/admin/products/[id]/images - Add new image to existing product
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin access
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id: productId } = await params
    const { imageUrl, altText, isPrimary } = await request.json()

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Get next sort order
    const maxSortOrder = Math.max(...product.images.map(img => img.sortOrder), -1)
    const nextSortOrder = maxSortOrder + 1

    // If this is set as primary, update other images
    if (isPrimary) {
      await prisma.productImage.updateMany({
        where: { productId },
        data: { isPrimary: false }
      })
    }

    // Create new image
    const newImage = await prisma.productImage.create({
      data: {
        productId,
        imageUrl,
        altText: altText || '',
        isPrimary: isPrimary || product.images.length === 0, // First image is primary
        sortOrder: nextSortOrder
      }
    })

    return NextResponse.json(newImage, { status: 201 })
  } catch (error) {
    console.error('Error adding image:', error)
    return NextResponse.json(
      { error: 'Failed to add image' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/products/[id]/images - Reorder images
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin access
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id: productId } = await params
    const { images } = await request.json()

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Update images in transaction
    await prisma.$transaction(async (tx) => {
      // Delete existing images
      await tx.productImage.deleteMany({
        where: { productId }
      })

      // Create images with new order
      if (images && images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((img: any, index: number) => ({
            productId,
            imageUrl: img.imageUrl,
            altText: img.altText || '',
            isPrimary: img.isPrimary || index === 0,
            sortOrder: index
          }))
        })
      }
    })

    // Return updated images
    const updatedImages = await prisma.productImage.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json({ images: updatedImages })
  } catch (error) {
    console.error('Error reordering images:', error)
    return NextResponse.json(
      { error: 'Failed to reorder images' },
      { status: 500 }
    )
  }
}