import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'
import { calculateRFMScores, getSegmentFromRFM, calculateCLV } from '@/lib/crm'

/**
 * GET /api/admin/customers/[id] — Full customer detail with RFM, CLV, orders, notes
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params

  try {
    const customer = await prisma.user.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, orderNumber: true, status: true, total: true, createdAt: true },
        },
        addresses: { orderBy: { isDefault: 'desc' } },
        reviews: { take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, rating: true, productId: true, createdAt: true } },
        supportTickets: { take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, ticketNumber: true, subject: true, status: true, createdAt: true } },
        _count: { select: { orders: true, reviews: true, supportTickets: true, wishlistItems: true } },
      },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Calculate aggregates
    const orderStats = await prisma.order.aggregate({
      where: { userId: id, status: { notIn: ['cancelled'] } },
      _sum: { total: true },
      _count: true,
      _min: { createdAt: true },
      _max: { createdAt: true },
    })

    const totalSpent = orderStats._sum.total || 0
    const totalOrders = orderStats._count || 0
    const firstOrder = orderStats._min.createdAt
    const lastOrder = orderStats._max.createdAt

    // RFM Analysis
    const daysSinceLastOrder = lastOrder ? Math.floor((Date.now() - new Date(lastOrder).getTime()) / (1000 * 60 * 60 * 24)) : 999
    const rfmScores = calculateRFMScores(daysSinceLastOrder, totalOrders, totalSpent)
    const segment = getSegmentFromRFM(rfmScores)

    // CLV
    const clv = firstOrder ? calculateCLV(totalSpent, totalOrders, firstOrder) : null

    // Get notes
    const notes = await prisma.customerNote.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({
      ...customer,
      analytics: {
        totalSpent,
        totalOrders,
        firstOrderDate: firstOrder,
        lastOrderDate: lastOrder,
        daysSinceLastOrder,
        rfmScores,
        segment,
        clv,
      },
      notes,
    })
  } catch (error: any) {
    console.error('Customer detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 })
  }
}
