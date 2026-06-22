import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'

/**
 * GET /api/admin/inventory/history
 * Fetch stock adjustment history with filters.
 * Query params: variantId, reason, page, limit, startDate, endDate
 */
export async function GET(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const variantId = searchParams.get('variantId')
    const reason = searchParams.get('reason')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}

    if (variantId) where.variantId = variantId
    if (reason) where.reason = reason
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const [adjustments, total] = await Promise.all([
      prisma.stockAdjustment.findMany({
        where,
        include: {
          variant: {
            select: {
              id: true,
              sku: true,
              size: true,
              product: { select: { id: true, name: true, sku: true } },
              color: { select: { colorName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.stockAdjustment.count({ where }),
    ])

    return NextResponse.json({
      adjustments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error: any) {
    console.error('Inventory history error:', error)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}
