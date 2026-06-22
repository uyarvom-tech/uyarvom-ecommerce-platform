import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'
import { analyzeCycleCount } from '@/lib/wms'

/**
 * GET /api/admin/wms/cycle-counts — List cycle counts
 * POST /api/admin/wms/cycle-counts — Schedule a new cycle count
 */
export async function GET(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = {}
    if (status) where.status = status

    const cycleCounts = await prisma.cycleCount.findMany({
      where,
      include: { _count: { select: { items: true } } },
      orderBy: { scheduledAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ cycleCounts })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch cycle counts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const { warehouseId, zone, scheduledAt, bins } = body

    if (!warehouseId || !scheduledAt) {
      return NextResponse.json({ error: 'warehouseId and scheduledAt are required' }, { status: 400 })
    }

    // If bins are provided, create items; otherwise it's a full-zone count
    const cycleCount = await prisma.cycleCount.create({
      data: {
        warehouseId,
        zone: zone || null,
        status: 'scheduled',
        scheduledAt: new Date(scheduledAt),
        totalBins: bins?.length || 0,
        items: bins?.length ? {
          create: bins.map((bin: any) => ({
            binCode: bin.binCode,
            variantId: bin.variantId,
            expectedQty: bin.expectedQty || 0,
          })),
        } : undefined,
      },
      include: { items: true },
    })

    return NextResponse.json(cycleCount, { status: 201 })
  } catch (error: any) {
    console.error('Cycle count error:', error)
    return NextResponse.json({ error: error.message || 'Failed to schedule cycle count' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/wms/cycle-counts — Submit cycle count results
 */
export async function PUT(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const { cycleCountId, items } = body

    if (!cycleCountId || !items?.length) {
      return NextResponse.json({ error: 'cycleCountId and items are required' }, { status: 400 })
    }

    // Analyze results
    const analysis = analyzeCycleCount(items)

    // Update cycle count with results
    const updated = await prisma.cycleCount.update({
      where: { id: cycleCountId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        countedBy: (authResult as any).userId,
        totalBins: analysis.totalBins,
        matchedBins: analysis.matchedBins,
        discrepancies: analysis.discrepancies.length,
        accuracyRate: analysis.accuracyRate,
      },
    })

    // Update individual items with actual quantities
    for (const item of items) {
      await prisma.cycleCountItem.updateMany({
        where: { cycleCountId, binCode: item.binCode, variantId: item.variantId },
        data: { actualQty: item.actualQty, variance: item.actualQty - item.expectedQty },
      })
    }

    return NextResponse.json({ cycleCount: updated, analysis })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to submit cycle count' }, { status: 500 })
  }
}
