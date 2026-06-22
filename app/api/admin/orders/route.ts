import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'
import { generateOrderNumber } from '@/lib/orders'

/**
 * GET /api/admin/orders — Advanced order search/filter with pagination
 * Query: status, paymentStatus, search, startDate, endDate, page, limit, sort
 */
export async function GET(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('paymentStatus')
    const search = searchParams.get('search')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sort = searchParams.get('sort') || 'newest'

    const where: any = {}

    if (status) where.status = status
    if (paymentStatus) where.paymentStatus = paymentStatus
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { shippingName: { contains: search, mode: 'insensitive' } },
        { shippingEmail: { contains: search, mode: 'insensitive' } },
        { shippingPhone: { contains: search } },
      ]
    }
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const orderBy: any = sort === 'oldest' ? { createdAt: 'asc' } :
      sort === 'total-high' ? { total: 'desc' } :
      sort === 'total-low' ? { total: 'asc' } :
      { createdAt: 'desc' }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          orderItems: { select: { id: true, productName: true, quantity: true, price: true, total: true } },
          _count: { select: { orderItems: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error: any) {
    console.error('Orders search error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

/**
 * POST /api/admin/orders — Manual order creation (admin-side)
 */
export async function POST(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const { userId, items, shippingAddress, paymentMethod, notes, paymentStatus } = body

    if (!userId || !items?.length || !shippingAddress) {
      return NextResponse.json(
        { error: 'userId, items, and shippingAddress are required' },
        { status: 400 }
      )
    }

    // Validate user exists
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate totals
    let subtotal = 0
    const orderItems: any[] = []

    for (const item of items) {
      if (!item.productId || !item.variantId || !item.quantity || item.quantity <= 0) {
        return NextResponse.json({ error: 'Each item needs productId, variantId, and positive quantity' }, { status: 400 })
      }

      const variant = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: true, color: true },
      })

      if (!variant) {
        return NextResponse.json({ error: `Variant ${item.variantId} not found` }, { status: 404 })
      }

      const price = item.price || variant.price || variant.product.price
      const total = price * item.quantity
      subtotal += total

      orderItems.push({
        productId: variant.productId,
        productVariantId: variant.id,
        quantity: item.quantity,
        price,
        total,
        productName: variant.product.name,
        variantName: variant.color ? `${variant.color.colorName} / ${variant.size}` : variant.size,
        skuSnapshot: variant.sku || variant.product.sku,
      })
    }

    const tax = Math.round(subtotal * 0.18) // 18% GST
    const shipping = subtotal >= 999 ? 0 : 50
    const total = subtotal + tax + shipping

    const orderNumber = generateOrderNumber()

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: 'confirmed',
          paymentStatus: paymentStatus || 'pending',
          paymentMethod: paymentMethod || 'cod',
          subtotal,
          tax,
          shipping,
          total,
          notes: notes || null,
          shippingName: shippingAddress.name,
          shippingEmail: user.email,
          shippingPhone: shippingAddress.phone || null,
          shippingAddress1: shippingAddress.address1,
          shippingAddress2: shippingAddress.address2 || null,
          shippingCity: shippingAddress.city,
          shippingState: shippingAddress.state,
          shippingZip: shippingAddress.zip,
          shippingCountry: shippingAddress.country || 'India',
        },
      })

      // Create order items and decrement stock
      for (const item of orderItems) {
        await tx.orderItem.create({ data: { orderId: newOrder.id, ...item } })
        await tx.productVariant.update({
          where: { id: item.productVariantId },
          data: { stock: { decrement: item.quantity } },
        })
      }

      // Create event
      await tx.orderEvent.create({
        data: {
          orderId: newOrder.id,
          type: 'order_placed',
          title: 'Manual Order Created',
          description: `Order created by admin. Payment: ${paymentMethod || 'cod'}.`,
          actorId: (authResult as any).userId,
        },
      })

      return newOrder
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error: any) {
    console.error('Manual order creation error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 })
  }
}
