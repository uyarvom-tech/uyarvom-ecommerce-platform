import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'

// GET /api/admin/products/[id]/variants/[variantId] - Get specific size variant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id, variantId } = await params

    const variant = await prisma.productVariant.findFirst({
      where: {
        id: variantId,
        productId: id,
      },
      include: {
        color: true,
      },
    })

    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }

    return NextResponse.json(variant)
  } catch (error) {
    console.error('Error fetching variant:', error)
    return NextResponse.json({ error: 'Failed to fetch variant' }, { status: 500 })
  }
}

// PUT /api/admin/products/[id]/variants/[variantId] - Update size variant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id, variantId } = await params
    const body = await request.json()
    const { size, price, stock, sku, sortOrder, isActive } = body

    const existingVariant = await prisma.productVariant.findFirst({
      where: {
        id: variantId,
        productId: id,
      },
    })

    if (!existingVariant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }

    const updatedVariant = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        size: size || existingVariant.size,
        value: size || existingVariant.value,
        name: 'Size',
        price: price !== undefined ? (price ? parseFloat(price) : null) : existingVariant.price,
        stock: stock !== undefined ? parseInt(stock) : existingVariant.stock,
        sku: sku !== undefined ? (sku || null) : existingVariant.sku,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : existingVariant.sortOrder,
        isActive: isActive !== undefined ? isActive : existingVariant.isActive,
        updatedAt: new Date(),
      },
    })

    const stockAggregate = await prisma.productVariant.aggregate({
      where: { productId: id },
      _sum: { stock: true },
    })

    await prisma.product.update({
      where: { id },
      data: {
        stockQuantity: stockAggregate._sum.stock ?? 0,
      },
    })

    return NextResponse.json(updatedVariant)
  } catch (error) {
    console.error('Error updating variant:', error)
    return NextResponse.json({ error: 'Failed to update variant' }, { status: 500 })
  }
}

// DELETE /api/admin/products/[id]/variants/[variantId] - Delete size variant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id, variantId } = await params

    const existingVariant = await prisma.productVariant.findFirst({
      where: {
        id: variantId,
        productId: id,
      },
    })

    if (!existingVariant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }

    const [orderItemsCount, cartItemsCount] = await Promise.all([
      prisma.orderItem.count({ where: { productVariantId: variantId } }),
      prisma.cartItem.count({ where: { productVariantId: variantId } }),
    ])

    if (orderItemsCount > 0 || cartItemsCount > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete variant that is used in orders or cart items',
          details: {
            orderItems: orderItemsCount,
            cartItems: cartItemsCount,
          },
        },
        { status: 400 }
      )
    }

    await prisma.productVariant.delete({ where: { id: variantId } })

    const stockAggregate = await prisma.productVariant.aggregate({
      where: { productId: id },
      _sum: { stock: true },
    })

    await prisma.product.update({
      where: { id },
      data: {
        stockQuantity: stockAggregate._sum.stock ?? 0,
      },
    })

    return NextResponse.json({ message: 'Variant deleted successfully' })
  } catch (error) {
    console.error('Error deleting variant:', error)
    return NextResponse.json({ error: 'Failed to delete variant' }, { status: 500 })
  }
}
