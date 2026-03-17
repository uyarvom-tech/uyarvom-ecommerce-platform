import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuthenticatedUser } from "@/lib/auth-middleware"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthenticatedUser(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params
    const data = await request.json()
    const { rating, title, comment } = data

    const existingReview = await prisma.review.findUnique({
      where: { id },
    })

    if (!existingReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    if (existingReview.userId !== authResult.dbUser.id) {
      return NextResponse.json(
        { error: "You can only edit your own reviews" },
        { status: 403 }
      )
    }

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        ...(rating !== undefined && { rating }),
        ...(title !== undefined && { title: title || null }),
        ...(comment !== undefined && { comment: comment || null }),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    return NextResponse.json(updatedReview)
  } catch (error) {
    console.error("Error updating review:", error)
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 })
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

    const existingReview = await prisma.review.findUnique({
      where: { id },
    })

    if (!existingReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    if (existingReview.userId !== authResult.dbUser.id) {
      return NextResponse.json(
        { error: "You can only delete your own reviews" },
        { status: 403 }
      )
    }

    await prisma.review.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Review deleted successfully" })
  } catch (error) {
    console.error("Error deleting review:", error)
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 })
  }
}
