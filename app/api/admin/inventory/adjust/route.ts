import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'
import { validateStockAdjustment, ADJUSTMENT_REASONS } from '@/lib/inventory'

/**
 * POST /api/admin/inventory/adjust
 * Adjust stock for a variant with reason code and audit trail.
 */
export async function POST(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const { variantId, type, quantity, reason, reference, notes } = body

    if (!variantId || !type || quantity === undefined || !reason) {
      return NextResponse.json(
        { error: 'variantId, type, quantity, and reason are required' },
        { status: 400 }
      )
    }

    // Validate reason code
    const validReasons = ADJUSTMENT_REASONS.map((r) => r.value)
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: `Invalid reason. Must be one of: ${validReasons.join(', ')}` },
        { status: 400 }
      )
    }

    // Get current variant stock
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { id: true, stock: true, sku: true, size: true, productId: true },
    })

    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }

    // Validate adjustment
    const validation = validateStockAdjustment(variant.stock, { type, quantity: Number(quantity) })
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Perform adjustment in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update variant stock
      let updatedVariant
      if (type === 'increment') {
        updatedVariant = await tx.productVariant.update({
          where: { id: variantId },
          data: { stock: { increment: Number(quantity) } },
        })
      } else if (type === 'decrement') {
        updatedVariant = await tx.productVariant.update({
          where: { id: variantId },
          data: { stock: { decrement: Number(quantity) } },
        })
      } else {
        updatedVariant = await tx.productVariant.update({
          where: { id: variantId },
          data: { stock: Number(quantity) },
        })
      }

      // Create stock adjustment record
      const adjustment = await tx.stockAdjustment.create({
        data: {
          variantId,
          type,
          quantity: Number(quantity),
          previousQty: variant.stock,
          newQty: updatedVariant.stock,
          reason,
          reference: reference || null,
          notes: notes || null,
          actorId: (authResult as any).userId || null,
        },
      })

      // Also create audit log for backward compatibility
      await tx.auditLog.create({
        data: {
          actorId: (authResult as any).userId || null,
          entityType: 'variant',
          entityId: variantId,
          action: 'stock_adjustment',
          description: `Stock ${type}: ${variant.stock} → ${updatedVariant.stock} (${reason}${notes ? ': ' + notes : ''})`,
          metadataJson: JSON.stringify({ type, quantity, reason, reference }),
        },
      })

      // Update product-level stockQuantity
      const stockAggregate = await tx.productVariant.aggregate({
        where: { productId: variant.productId },
        _sum: { stock: true },
      })

      await tx.product.update({
        where: { id: variant.productId },
        data: { stockQuantity: stockAggregate._sum.stock ?? 0 },
      })

      return { adjustment, updatedStock: updatedVariant.stock }
    })

    return NextResponse.json({
      success: true,
      variantId,
      previousStock: variant.stock,
      newStock: result.updatedStock,
      adjustmentId: result.adjustment.id,
    })
  } catch (error: any) {
    console.error('Stock adjustment error:', error)
    return NextResponse.json({ error: error.message || 'Failed to adjust stock' }, { status: 500 })
  }
}
