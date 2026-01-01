import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAdmin } from '@/lib/auth-middleware'

const prisma = new PrismaClient()

// GET /api/admin/products/[id]/variants/[variantId] - Get specific variant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    await requireAdmin(request)
    const { id, variantId } = await params

    const variant = await prisma.productVariant.findUnique({
      where: {
        id: variantId,
        productId: id
      }
    })

    if (!variant) {
      return NextResponse.json(
        { error: 'Variant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(variant)
  } catch (error) {
    console.error('Error fetching variant:', error)
    return NextResponse.json(
      { error: 'Failed to fetch variant' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/products/[id]/variants/[variantId] - Update variant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    await requireAdmin(request)
    const { id, variantId } = await params

    const body = await request.json()
    const { name, value, price, stock, sku, sortOrder, isActive, colorCode, colorImage } = body

    // Check if variant exists
    const existingVariant = await prisma.productVariant.findUnique({
      where: {
        id: variantId,
        productId: id
      }
    })

    if (!existingVariant) {
      return NextResponse.json(
        { error: 'Variant not found' },
        { status: 404 }
      )
    }

    // Check for duplicate name/value combination (excluding current variant)
    if (name && value) {
      const duplicateVariant = await prisma.productVariant.findFirst({
        where: {
          productId: id,
          name,
          value,
          id: { not: variantId }
        }
      })

      if (duplicateVariant) {
        return NextResponse.json(
          { error: 'Variant with this name and value already exists' },
          { status: 400 }
        )
      }
    }

    // Update the variant
    const updatedVariant = await prisma.productVariant.update({
      where: {
        id: variantId
      },
      data: {
        name: name || existingVariant.name,
        value: value || existingVariant.value,
        price: price !== undefined ? (price ? parseFloat(price) : null) : existingVariant.price,
        stock: stock !== undefined ? parseInt(stock) : existingVariant.stock,
        sku: sku !== undefined ? (sku || null) : existingVariant.sku,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : existingVariant.sortOrder,
        isActive: isActive !== undefined ? isActive : existingVariant.isActive,
        colorCode: colorCode !== undefined ? (colorCode || null) : existingVariant.colorCode,
        colorImage: colorImage !== undefined ? (colorImage || null) : existingVariant.colorImage,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(updatedVariant)
  } catch (error) {
    console.error('Error updating variant:', error)
    return NextResponse.json(
      { error: 'Failed to update variant' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/products/[id]/variants/[variantId] - Delete variant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    await requireAdmin(request)
    const { id, variantId } = await params

    // Check if variant exists
    const existingVariant = await prisma.productVariant.findUnique({
      where: {
        id: variantId,
        productId: id
      }
    })

    if (!existingVariant) {
      return NextResponse.json(
        { error: 'Variant not found' },
        { status: 404 }
      )
    }

    // Check if variant is used in orders or cart items
    const [orderItemsCount, cartItemsCount] = await Promise.all([
      prisma.orderItem.count({
        where: { productVariantId: variantId }
      }),
      prisma.cartItem.count({
        where: { productVariantId: variantId }
      })
    ])

    if (orderItemsCount > 0 || cartItemsCount > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete variant that is used in orders or cart items',
          details: {
            orderItems: orderItemsCount,
            cartItems: cartItemsCount
          }
        },
        { status: 400 }
      )
    }

    // Delete the variant
    await prisma.productVariant.delete({
      where: {
        id: variantId
      }
    })

    return NextResponse.json({ message: 'Variant deleted successfully' })
  } catch (error) {
    console.error('Error deleting variant:', error)
    return NextResponse.json(
      { error: 'Failed to delete variant' },
      { status: 500 }
    )
  }
}