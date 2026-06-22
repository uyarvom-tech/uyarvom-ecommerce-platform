import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'
import { calculateRFMScores, getSegmentFromRFM, SEGMENT_LABELS } from '@/lib/crm'

/**
 * GET /api/admin/segments — List segments with member counts
 * POST /api/admin/segments — Run RFM segmentation (auto-assigns customers)
 */
export async function GET(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const segments = await prisma.customerSegment.findMany({
      include: { _count: { select: { members: true } } },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ segments, segmentLabels: SEGMENT_LABELS })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch segments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    // Run RFM segmentation on all customers
    const customers = await prisma.user.findMany({
      select: {
        id: true,
        orders: {
          where: { status: { notIn: ['cancelled'] } },
          select: { total: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    const segmentCounts: Record<string, string[]> = {}

    for (const customer of customers) {
      if (customer.orders.length === 0) continue

      const totalSpent = customer.orders.reduce((sum, o) => sum + o.total, 0)
      const lastOrder = customer.orders[0]?.createdAt
      const daysSince = lastOrder ? Math.floor((Date.now() - new Date(lastOrder).getTime()) / (1000 * 60 * 60 * 24)) : 999

      const rfm = calculateRFMScores(daysSince, customer.orders.length, totalSpent)
      const segment = getSegmentFromRFM(rfm)

      if (!segmentCounts[segment]) segmentCounts[segment] = []
      segmentCounts[segment].push(customer.id)
    }

    // Upsert segments and assign members
    const results: Array<{ segment: string; count: number }> = []

    for (const [segmentKey, userIds] of Object.entries(segmentCounts)) {
      const info = SEGMENT_LABELS[segmentKey as keyof typeof SEGMENT_LABELS]

      const segment = await prisma.customerSegment.upsert({
        where: { name: segmentKey },
        update: { memberCount: userIds.length, description: info?.description, color: info?.color },
        create: { name: segmentKey, description: info?.description, color: info?.color, type: 'rfm', isAutomatic: true, memberCount: userIds.length },
      })

      // Clear old members and add new
      await prisma.customerSegmentMember.deleteMany({ where: { segmentId: segment.id } })
      if (userIds.length > 0) {
        await prisma.customerSegmentMember.createMany({
          data: userIds.map((userId) => ({ segmentId: segment.id, userId })),
        })
      }

      results.push({ segment: segmentKey, count: userIds.length })
    }

    return NextResponse.json({
      success: true,
      message: `Segmentation complete. ${customers.length} customers analyzed.`,
      segments: results,
    })
  } catch (error: any) {
    console.error('Segmentation error:', error)
    return NextResponse.json({ error: error.message || 'Failed to run segmentation' }, { status: 500 })
  }
}
