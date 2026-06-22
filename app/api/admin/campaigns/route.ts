import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'
import { getCampaignStatus } from '@/lib/promotions'

/**
 * GET /api/admin/campaigns — List campaigns
 * POST /api/admin/campaigns — Create campaign
 */
export async function GET(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const campaigns = await prisma.campaign.findMany({ orderBy: { startDate: 'desc' } })
    // Enrich with computed status
    const enriched = campaigns.map((c) => ({
      ...c,
      computedStatus: getCampaignStatus(c.startDate, c.endDate),
    }))
    return NextResponse.json({ campaigns: enriched })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { name, type, startDate, endDate, description, targetSegments, couponCodes, bannerImage } = await request.json()

    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: 'name, startDate, endDate are required' }, { status: 400 })
    }

    const campaign = await prisma.campaign.create({
      data: {
        name, type: type || 'seasonal',
        status: getCampaignStatus(new Date(startDate), new Date(endDate)),
        startDate: new Date(startDate), endDate: new Date(endDate),
        description, bannerImage,
        targetSegments: targetSegments ? JSON.stringify(targetSegments) : null,
        couponCodes: couponCodes ? JSON.stringify(couponCodes) : null,
      },
    })

    return NextResponse.json(campaign, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create campaign' }, { status: 500 })
  }
}
