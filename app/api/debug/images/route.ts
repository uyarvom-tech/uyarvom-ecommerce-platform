import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Debug endpoint to check image data
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5 // Just get the latest 5 products
    })

    return NextResponse.json({
      message: 'Debug: Latest products with images',
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        createdAt: product.createdAt,
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
    console.error('Debug error:', error)
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 })
  }
}