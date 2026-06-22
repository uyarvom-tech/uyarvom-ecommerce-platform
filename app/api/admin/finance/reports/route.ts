import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'
import { calculateProfitAndLoss, calculateGST } from '@/lib/finance'

/**
 * GET /api/admin/finance/reports?type=pnl|gst|summary
 * Financial report generation endpoint.
 */
export async function GET(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'summary'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const dateFilter: any = {}
    if (startDate) dateFilter.gte = new Date(startDate)
    if (endDate) dateFilter.lte = new Date(endDate)
    const hasDateFilter = startDate || endDate

    if (reportType === 'pnl') {
      // Profit & Loss
      const orders = await prisma.order.findMany({
        where: {
          status: { notIn: ['cancelled'] },
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
        },
        select: { subtotal: true, tax: true, shipping: true, total: true },
      })

      const salesRevenue = orders.reduce((s, o) => s + o.subtotal, 0)
      const shippingRevenue = orders.reduce((s, o) => s + o.shipping, 0)
      const estimatedCOGS = salesRevenue * 0.5 // Rough estimate without full COGS tracking

      const pnl = calculateProfitAndLoss(salesRevenue, shippingRevenue, 0, estimatedCOGS, 0, 0, 0, 0)

      return NextResponse.json({ type: 'pnl', period: { startDate, endDate }, ...pnl, orderCount: orders.length })
    }

    if (reportType === 'gst') {
      // GST Report
      const orders = await prisma.order.findMany({
        where: {
          status: { notIn: ['cancelled'] },
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
        },
        select: { subtotal: true, tax: true, shippingState: true, total: true, createdAt: true },
      })

      const totalTaxCollected = orders.reduce((s, o) => s + o.tax, 0)
      const totalTaxableAmount = orders.reduce((s, o) => s + o.subtotal, 0)

      return NextResponse.json({
        type: 'gst',
        period: { startDate, endDate },
        totalTaxableAmount,
        totalGSTCollected: totalTaxCollected,
        orderCount: orders.length,
        effectiveRate: totalTaxableAmount > 0 ? Math.round((totalTaxCollected / totalTaxableAmount) * 100 * 10) / 10 : 0,
      })
    }

    // Summary (default)
    const [totalRevenue, totalOrders, pendingInvoices, recentPayments] = await Promise.all([
      prisma.order.aggregate({ where: { status: { notIn: ['cancelled'] } }, _sum: { total: true } }),
      prisma.order.count({ where: { status: { notIn: ['cancelled'] } } }),
      prisma.invoice.count({ where: { status: { in: ['sent', 'overdue'] } } }),
      prisma.payment.count(),
    ])

    return NextResponse.json({
      type: 'summary',
      totalRevenue: totalRevenue._sum.total || 0,
      totalOrders,
      pendingInvoices,
      totalPayments: recentPayments,
    })
  } catch (error: any) {
    console.error('Finance report error:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
