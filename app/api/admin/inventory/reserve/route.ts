import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'

/**
 * POST /api/admin/inventory/reserve — Reserve stock for an order
 * POST body: { variantId, quantity, orderId }
 *
 * DELETE /api/admin/inventory/reserve — Release reserved stock
 * DELETE body: { variantId, quantity, orderId }
 */
export async function POST(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { variantId, quantity, orderId } = await request.json()

    if (!variantId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'variantId and positive quantity required' }, { status: 400 })
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { id: true, stock: true },
    })

    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }

    if (variant.stock < quantity) {
      return NextResponse.json(
        { error: `Insufficient stock. Available: ${variant.stock}, Requested: ${quantity}` },
        { status: 400 }
      )
    }

    // Decrement stock (reserve)
    const updated = await prisma.$transaction(async (tx) => {
      const updatedVariant = await tx.productVariant.update({
        where: { id: variantId },
        data: { stock: { decrement: quantity } },
      })

      await tx.stockAdjustment.create({
        data: {
          variantId,
          type: 'decrement',
          quantity,
          previousQty: variant.stock,
          newQty: updatedVariant.stock,
          reason: 'reserved',
          reference: orderId || null,
          actorId: (authResult as any).userId || null,
        },
      })

      return updatedVariant
    })

    return NextResponse.json({
      success: true,
      variantId,
      previousStock: variant.stock,
      newStock: updated.stock,
      reserved: quantity,
    })
  } catch (error: any) {
    console.error('Reserve error:', error)
    return NextResponse.json({ error: error.message || 'Failed to reserve stock' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { variantId, quantity, orderId } = await request.json()

    if (!variantId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'variantId and positive quantity required' }, { status: 400 })
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { id: true, stock: true },
    })

    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }

    // Increment stock (release reservation)
    const updated = await prisma.$transaction(async (tx) => {
      const updatedVariant = await tx.productVariant.update({
        where: { id: variantId },
        data: { stock: { increment: quantity } },
      })

      await tx.stockAdjustment.create({
        data: {
          variantId,
          type: 'increment',
          quantity,
          previousQty: variant.stock,
          newQty: updatedVariant.stock,
          reason: 'released',
          reference: orderId || null,
          actorId: (authResult as any).userId || null,
        },
      })

      return updatedVariant
    })

    return NextResponse.json({
      success: true,
      variantId,
      previousStock: variant.stock,
      newStock: updated.stock,
      released: quantity,
    })
  } catch (error: any) {
    console.error('Release error:', error)
    return NextResponse.json({ error: error.message || 'Failed to release stock' }, { status: 500 })
  }
}
