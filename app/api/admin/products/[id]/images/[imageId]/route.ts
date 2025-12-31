import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-middleware'

// DELETE /api/admin/products/[id]/images/[imageId] - Delete specific image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  // Check admin access
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id: productId, imageId } = await params

    // Check if image exists and belongs to the product
    const image = await prisma.productImage.findFirst({
      where: {
        id: imageId,
        productId
      }
    })

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // Get all images for this product
    const allImages = await prisma.productImage.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' }
    })

    // Don't allow deleting the last image
    if (allImages.length <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the last image. Products must have at least one image.' },
        { status: 400 }
      )
    }

    // Delete the image
    await prisma.productImage.delete({
      where: { id: imageId }
    })

    // If deleted image was primary, make the first remaining image primary
    if (image.isPrimary) {
      const remainingImages = allImages.filter(img => img.id !== imageId)
      if (remainingImages.length > 0) {
        await prisma.productImage.update({
          where: { id: remainingImages[0].id },
          data: { isPrimary: true }
        })
      }
    }

    // Reorder remaining images
    const remainingImages = await prisma.productImage.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' }
    })

    // Update sort orders to be sequential
    await Promise.all(
      remainingImages.map((img, index) =>
        prisma.productImage.update({
          where: { id: img.id },
          data: { sortOrder: index }
        })
      )
    )

    return NextResponse.json({ message: 'Image deleted successfully' })
  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/products/[id]/images/[imageId] - Update specific image
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  // Check admin access
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id: productId, imageId } = await params
    const { altText, isPrimary } = await request.json()

    // Check if image exists and belongs to the product
    const image = await prisma.productImage.findFirst({
      where: {
        id: imageId,
        productId
      }
    })

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // If setting as primary, update other images
    if (isPrimary && !image.isPrimary) {
      await prisma.productImage.updateMany({
        where: { 
          productId,
          id: { not: imageId }
        },
        data: { isPrimary: false }
      })
    }

    // Update the image
    const updatedImage = await prisma.productImage.update({
      where: { id: imageId },
      data: {
        altText: altText !== undefined ? altText : image.altText,
        isPrimary: isPrimary !== undefined ? isPrimary : image.isPrimary
      }
    })

    return NextResponse.json(updatedImage)
  } catch (error) {
    console.error('Error updating image:', error)
    return NextResponse.json(
      { error: 'Failed to update image' },
      { status: 500 }
    )
  }
}