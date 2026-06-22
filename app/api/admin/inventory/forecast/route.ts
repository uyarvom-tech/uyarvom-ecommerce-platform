import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'
import { calculateForecast, type ForecastResult } from '@/lib/inventory'

/**
 * GET /api/admin/inventory/forecast
 * Returns demand forecast for all active variants based on sales data.
 * Query params: days (lookback period, default 30), leadTime (default 7)
 */
export async function GET(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const leadTime = parseInt(searchParams.get('leadTime') || '7')

    const lookbackDate = new Date()
    lookbackDate.setDate(lookbackDate.getDate() - days)

    // Get all active variants with their products
    const variants = await prisma.productVariant.findMany({
      where: { isActive: true },
      select: {
        id: true,
        stock: true,
        sku: true,
        size: true,
        product: { select: { id: true, name: true, lowStockThreshold: true } },
        color: { select: { colorName: true } },
      },
    })

    // Get sales data from order items in the lookback period
    const salesData = await prisma.orderItem.groupBy({
      by: ['productVariantId'],
      where: {
        order: {
          createdAt: { gte: lookbackDate },
          status: { notIn: ['cancelled'] },
        },
        productVariantId: { not: null },
      },
      _sum: { quantity: true },
    })

    const salesMap = new Map(
      salesData.map((item) => [item.productVariantId, item._sum.quantity || 0])
    )

    // Calculate forecast for each variant
    const forecasts: ForecastResult[] = variants.map((variant) => {
      const totalSold = salesMap.get(variant.id) || 0
      const forecast = calculateForecast(variant.stock, totalSold, days, leadTime)

      return {
        variantId: variant.id,
        productName: `${variant.product.name} (${variant.color?.colorName || 'Default'} / ${variant.size || 'Default'})`,
        currentStock: variant.stock,
        ...forecast,
      }
    })

    // Sort by urgency: critical first, then low, then adequate
    const statusOrder = { critical: 0, low: 1, adequate: 2, overstocked: 3 }
    forecasts.sort((a, b) => statusOrder[a.status] - statusOrder[b.status])

    const summary = {
      total: forecasts.length,
      critical: forecasts.filter((f) => f.status === 'critical').length,
      low: forecasts.filter((f) => f.status === 'low').length,
      adequate: forecasts.filter((f) => f.status === 'adequate').length,
      overstocked: forecasts.filter((f) => f.status === 'overstocked').length,
    }

    return NextResponse.json({ forecasts, summary, periodDays: days, leadTimeDays: leadTime })
  } catch (error: any) {
    console.error('Forecast error:', error)
    return NextResponse.json({ error: 'Failed to generate forecast' }, { status: 500 })
  }
}
