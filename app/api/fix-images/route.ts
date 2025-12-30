import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - List all products with their images
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        images: product.images.map(img => ({
          id: img.id,
          imageUrl: img.imageUrl,
          altText: img.altText,
          isPrimary: img.isPrimary,
          sortOrder: img.sortOrder
        }))
      }))
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

// POST - Add image to a specific product
export async function POST(request: NextRequest) {
  try {
    const { productId, imageUrl, altText } = await request.json()

    if (!productId || !imageUrl) {
      return NextResponse.json({ error: 'Product ID and image URL are required' }, { status: 400 })
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Delete existing images first (clean slate)
    await prisma.productImage.deleteMany({
      where: { productId }
    })

    // Add the new image as primary
    const image = await prisma.productImage.create({
      data: {
        productId,
        imageUrl,
        altText: altText || 'Product image',
        isPrimary: true,
        sortOrder: 0
      }
    })

    return NextResponse.json({
      message: 'Image added successfully',
      image
    })
  } catch (error) {
    console.error('Error adding image:', error)
    return NextResponse.json({ error: 'Failed to add image' }, { status: 500 })
  }
}