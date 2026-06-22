import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'
import { calculateReturnRate, calculateAvgProcessingDays } from '@/lib/returns'

/**
 * GET /api/admin/returns/analytics — Return analytics and metrics
 */
export async function GET(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const [totalReturns, totalOrders, approvedReturns, totalRefunded, reasonCounts] = await Promise.all([
      prisma.returnRequest.count(),
      prisma.order.count({ where: { status: { notIn: ['cancelled'] } } }),
      prisma.returnRequest.count({ where: { status: { in: ['approved', 'refunded', 'replaced', 'closed'] } } }),
      prisma.returnRequest.aggregate({ where: { refundedAt: { not: null } }, _sum: { refundAmount: true } }),
      prisma.returnRequest.groupBy({ by: ['reason'], _count: true }),
    ])

    const returnRate = calculateReturnRate(totalReturns, totalOrders)
    const approvalRate = totalReturns > 0 ? Math.round((approvedReturns / totalReturns) * 100) : 0

    const reasonBreakdown: Record<string, number> = {}
    for (const item of reasonCounts) {
      reasonBreakdown[item.reason] = item._count
    }

    return NextResponse.json({
      totalReturns,
      returnRate,
      approvalRate,
      totalRefunded: totalRefunded._sum.refundAmount || 0,
      reasonBreakdown,
      totalOrders,
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
