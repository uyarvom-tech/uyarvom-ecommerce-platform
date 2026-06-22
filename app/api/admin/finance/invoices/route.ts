import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'
import { generateInvoiceNumber, calculateInvoiceTotals, type InvoiceType } from '@/lib/finance'

/**
 * GET /api/admin/finance/invoices — List invoices
 * POST /api/admin/finance/invoices — Create invoice
 */
export async function GET(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {}
    if (type) where.type = type
    if (status) where.status = status

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: { lineItems: true, payments: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ])

    return NextResponse.json({ invoices, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const { type, orderId, vendorId, customerId, items, dueDate, notes } = body

    if (!items?.length) {
      return NextResponse.json({ error: 'At least one line item is required' }, { status: 400 })
    }

    const totals = calculateInvoiceTotals(items)
    const invoiceNumber = generateInvoiceNumber(type as InvoiceType || 'sales')

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        type: type || 'sales',
        status: 'draft',
        orderId, vendorId, customerId,
        subtotal: totals.subtotal,
        discount: totals.totalDiscount,
        taxableAmount: totals.taxableAmount,
        gstAmount: totals.totalGST,
        total: totals.grandTotal,
        paidAmount: 0,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
        lineItems: {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            gstRate: item.gstRate || 18,
            amount: item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100),
          })),
        },
      },
      include: { lineItems: true },
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create invoice' }, { status: 500 })
  }
}
