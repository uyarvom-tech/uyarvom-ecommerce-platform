import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'

/**
 * GET /api/admin/vendors/[id] — Get vendor details with performance metrics
 * PUT /api/admin/vendors/[id] — Update vendor
 * DELETE /api/admin/vendors/[id] — Deactivate vendor
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params

  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        purchaseOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, poNumber: true, status: true, total: true, createdAt: true, receivedAt: true },
        },
        _count: { select: { purchaseOrders: true, goodsReceipts: true } },
      },
    })

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Calculate basic performance metrics
    const allPOs = await prisma.purchaseOrder.findMany({
      where: { vendorId: id },
      select: { status: true, total: true, expectedDeliveryDate: true, receivedAt: true, createdAt: true },
    })

    const totalSpent = allPOs.filter((po: any) => ['received', 'invoiced'].includes(po.status)).reduce((sum: number, po: any) => sum + po.total, 0)
    const totalOrders = allPOs.length
    const receivedPOs = allPOs.filter((po: any) => po.receivedAt)
    const onTimePOs = receivedPOs.filter((po: any) => po.expectedDeliveryDate && po.receivedAt && new Date(po.receivedAt) <= new Date(po.expectedDeliveryDate))
    const onTimeRate = receivedPOs.length > 0 ? Math.round((onTimePOs.length / receivedPOs.length) * 100) : 0

    const performance = {
      totalOrders,
      totalSpent,
      onTimeDeliveryRate: onTimeRate,
      completedOrders: receivedPOs.length,
    }

    return NextResponse.json({ ...vendor, performance })
  } catch (error: any) {
    console.error('Vendor fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch vendor' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params

  try {
    const body = await request.json()
    const { name, contactName, email, phone, address, city, state, pincode, gstNumber, panNumber, paymentTerms, leadTimeDays, notes, isActive } = body

    const vendor = await prisma.vendor.update({
      where: { id },
      data: { name, contactName, email, phone, address, city, state, pincode, gstNumber, panNumber, paymentTerms, leadTimeDays, notes, isActive },
    })

    return NextResponse.json(vendor)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }
    console.error('Vendor update error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update vendor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params

  try {
    // Soft-delete: deactivate instead of removing
    await prisma.vendor.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true, message: 'Vendor deactivated' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to deactivate vendor' }, { status: 500 })
  }
}
