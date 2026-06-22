import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'
import { aggregateRevenueTrends, calculateYoYGrowth, calculateMargins, calculateInventoryValue, calculateRepeatRate, calculateChurnRate, calculateNPS, calculateWarehouseMetrics, calculateSupplierScore } from '@/lib/analytics'

/**
 * GET /api/admin/analytics?type=revenue|customers|inventory|operations|suppliers
 * Comprehensive analytics dashboard data.
 */
export async function GET(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'revenue'
    const period = searchParams.get('period') || '30' // days
    const groupBy = (searchParams.get('groupBy') || 'daily') as 'daily' | 'weekly' | 'monthly'

    const daysAgo = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)

    if (type === 'revenue') {
      const orders = await prisma.order.findMany({
        where: { status: { notIn: ['cancelled'] }, createdAt: { gte: startDate } },
        select: { total: true, subtotal: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      })

      const trends = aggregateRevenueTrends(orders, groupBy)
      const totalRevenue = orders.reduce((s, o) => s + o.total, 0)
      const totalOrders = orders.length

      // Previous period for YoY
      const prevStart = new Date(startDate)
      prevStart.setDate(prevStart.getDate() - daysAgo)
      const prevOrders = await prisma.order.findMany({
        where: { status: { notIn: ['cancelled'] }, createdAt: { gte: prevStart, lt: startDate } },
        select: { total: true },
      })
      const prevRevenue = prevOrders.reduce((s, o) => s + o.total, 0)

      const growth = calculateYoYGrowth(totalRevenue, prevRevenue)
      const margins = calculateMargins(totalRevenue, totalRevenue * 0.5) // Estimated 50% COGS

      return NextResponse.json({ type: 'revenue', period: daysAgo, trends, totalRevenue, totalOrders, growth, margins })
    }

    if (type === 'customers') {
      const [totalCustomers, newCustomers, repeatCustomers, ratings] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: startDate } } }),
        prisma.user.count({ where: { orders: { some: { createdAt: { gte: startDate } } }, _count: { orders: { gt: 1 } } } }),
        prisma.review.findMany({ where: { createdAt: { gte: startDate } }, select: { rating: true } }),
      ])

      // Churned = customers with orders before period but not during
      const activeInPeriod = await prisma.order.findMany({
        where: { createdAt: { gte: startDate }, status: { notIn: ['cancelled'] } },
        select: { userId: true },
        distinct: ['userId'],
      })

      const repeatRate = calculateRepeatRate(totalCustomers, repeatCustomers)
      const nps = calculateNPS(ratings.map(r => r.rating))
      const churnRate = calculateChurnRate(totalCustomers, totalCustomers - activeInPeriod.length)

      return NextResponse.json({ type: 'customers', totalCustomers, newCustomers, repeatRate, churnRate, nps, activeCustomers: activeInPeriod.length })
    }

    if (type === 'inventory') {
      const products = await prisma.product.findMany({
        where: { isActive: true },
        select: { price: true, buyingPrice: true, stockQuantity: true },
      })

      const inventoryValue = calculateInventoryValue(
        products.map(p => ({ stock: p.stockQuantity, buyingPrice: p.buyingPrice || p.price * 0.5, sellingPrice: p.price }))
      )

      const [outOfStock, lowStock] = await Promise.all([
        prisma.product.count({ where: { stockQuantity: 0, isActive: true } }),
        prisma.product.count({ where: { isActive: true, stockQuantity: { gt: 0, lte: 10 } } }),
      ])

      return NextResponse.json({ type: 'inventory', ...inventoryValue, outOfStock, lowStock })
    }

    if (type === 'operations') {
      const [pendingOrders, processingOrders, shippedOrders] = await Promise.all([
        prisma.order.count({ where: { status: 'pending' } }),
        prisma.order.count({ where: { status: 'processing' } }),
        prisma.order.count({ where: { status: 'shipped' } }),
      ])

      const metrics = calculateWarehouseMetrics(pendingOrders + processingOrders + shippedOrders, 8, 0, 100, 0, 100)

      return NextResponse.json({ type: 'operations', pendingOrders, processingOrders, shippedOrders, metrics })
    }

    if (type === 'suppliers') {
      const vendors = await prisma.vendor.findMany({
        where: { isActive: true },
        select: { id: true, name: true, _count: { select: { purchaseOrders: true } } },
      })

      const scorecards = vendors.map(v => ({
        vendorId: v.id,
        vendorName: v.name,
        totalOrders: v._count.purchaseOrders,
        overallScore: calculateSupplierScore(85, 90), // Placeholder until real data
      }))

      return NextResponse.json({ type: 'suppliers', scorecards })
    }

    return NextResponse.json({ error: 'Invalid analytics type' }, { status: 400 })
  } catch (error: any) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
