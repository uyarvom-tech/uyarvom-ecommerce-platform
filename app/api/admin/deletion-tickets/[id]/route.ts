import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminAccess } from "@/lib/auth-middleware"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAdminAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params
    const { action } = await request.json()

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "approve" or "reject"' },
        { status: 400 }
      )
    }

    const ticket = await prisma.deletionTicket.findUnique({
      where: { id },
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    if (ticket.status !== "pending") {
      return NextResponse.json({ error: "Ticket has already been reviewed" }, { status: 400 })
    }

    const updatedTicket = await prisma.deletionTicket.update({
      where: { id },
      data: {
        status: action === "approve" ? "approved" : "rejected",
        reviewedBy: authResult.dbUser.id,
      },
      include: {
        requester: {
          select: { id: true, fullName: true, email: true },
        },
        reviewer: {
          select: { id: true, fullName: true, email: true },
        },
      },
    })

    if (action === "approve") {
      try {
        if (ticket.type === "product") {
          await prisma.product.delete({
            where: { id: ticket.itemId },
          })
        } else if (ticket.type === "category") {
          await prisma.category.delete({
            where: { id: ticket.itemId },
          })
        }
      } catch (deleteError) {
        console.error("Failed to delete item:", deleteError)
        await prisma.deletionTicket.update({
          where: { id },
          data: { status: "rejected" },
        })
        return NextResponse.json(
          { error: "Failed to delete item. It may have dependencies." },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({
      message: `Deletion request ${action}d successfully`,
      ticket: updatedTicket,
    })
  } catch (error) {
    console.error("Deletion ticket review error:", error)
    return NextResponse.json(
      { error: "Failed to review deletion ticket" },
      { status: 500 }
    )
  }
}
