import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireStaffAccess } from "@/lib/auth-middleware"

export async function GET(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const isAdmin = ["admin", "super_admin"].includes(authResult.role)

    const tickets = await prisma.deletionTicket.findMany({
      where: isAdmin ? {} : { requestedBy: authResult.dbUser.id },
      include: {
        requester: {
          select: { id: true, fullName: true, email: true },
        },
        reviewer: {
          select: { id: true, fullName: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error("Deletion tickets fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch deletion tickets" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { type, itemId, itemName, reason } = await request.json()

    if (!type || !itemId || !itemName || !reason) {
      return NextResponse.json(
        { error: "Type, item ID, item name, and reason are required" },
        { status: 400 }
      )
    }

    if (!["product", "category"].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be either "product" or "category"' },
        { status: 400 }
      )
    }

    const ticket = await prisma.deletionTicket.create({
      data: {
        type,
        itemId,
        itemName,
        reason,
        requestedBy: authResult.dbUser.id,
      },
      include: {
        requester: {
          select: { id: true, fullName: true, email: true },
        },
      },
    })

    return NextResponse.json({
      message: "Deletion request submitted successfully",
      ticket,
    })
  } catch (error) {
    console.error("Deletion ticket creation error:", error)
    return NextResponse.json(
      { error: "Failed to create deletion ticket" },
      { status: 500 }
    )
  }
}
