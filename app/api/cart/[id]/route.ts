import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuthenticatedUser } from "@/lib/auth-middleware"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthenticatedUser(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params
    const body = await request.json()
    const quantity = Math.trunc(Number(body.quantity ?? 0))

    if (quantity < 1) {
      return NextResponse.json({ error: "Quantity must be at least 1" }, { status: 400 })
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id,
        userId: authResult.authUser.id,
      },
      include: {
        product: {
          select: {
            stockQuantity: true,
          },
        },
      },
    })

    if (!cartItem) {
      return NextResponse.json({ error: "Cart item not found" }, { status: 404 })
    }

    if (quantity > cartItem.product.stockQuantity) {
      return NextResponse.json({ error: "Requested quantity exceeds available stock" }, { status: 409 })
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
    })

    return NextResponse.json({ item: updatedItem })
  } catch (error) {
    console.error("Error updating cart item:", error)
    return NextResponse.json({ error: "Failed to update cart item" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthenticatedUser(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params

    const deleted = await prisma.cartItem.deleteMany({
      where: {
        id,
        userId: authResult.authUser.id,
      },
    })

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Cart item not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting cart item:", error)
    return NextResponse.json({ error: "Failed to remove cart item" }, { status: 500 })
  }
}
