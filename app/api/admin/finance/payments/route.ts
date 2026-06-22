import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'

/**
 * POST /api/admin/finance/payments — Record a payment against an invoice
 */
export async function POST(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { invoiceId, type, method, amount, reference, notes } = await request.json()

    if (!type || !method || !amount || amount <= 0) {
      return NextResponse.json({ error: 'type, method, and positive amount are required' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          invoiceId: invoiceId || null,
          type, method,
          amount,
          reference: reference || null,
          notes: notes || null,
          createdBy: (authResult as any).userId,
        },
      })

      // Update invoice paid amount if linked
      if (invoiceId) {
        const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } })
        if (invoice) {
          const newPaid = invoice.paidAmount + amount
          const newStatus = newPaid >= invoice.total ? 'paid' : 'partially_paid'
          await tx.invoice.update({
            where: { id: invoiceId },
            data: { paidAmount: newPaid, status: newStatus, paidAt: newStatus === 'paid' ? new Date() : undefined },
          })
        }
      }

      return payment
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to record payment' }, { status: 500 })
  }
}
