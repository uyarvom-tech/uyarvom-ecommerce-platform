import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuthenticatedUser } from "@/lib/auth-middleware"

export async function POST(request: NextRequest) {
  const authResult = await requireAuthenticatedUser(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const data = await request.json()
    const { productId, productSlug, rating, title, comment } = data

    if ((!productId && !productSlug) || !rating) {
      return NextResponse.json(
        { error: "Product ID/slug and rating are required" },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    const product = productId
      ? await prisma.product.findUnique({ where: { id: productId } })
      : await prisma.product.findUnique({ where: { slug: productSlug } })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId: authResult.dbUser.id,
          productId: product.id,
        },
      },
    })

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 400 }
      )
    }

    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId: product.id,
        order: {
          userId: authResult.dbUser.id,
          status: "completed",
        },
      },
    })

    const review = await prisma.review.create({
      data: {
        userId: authResult.dbUser.id,
        productId: product.id,
        rating,
        title: title || null,
        comment: comment || null,
        isVerified: !!hasPurchased,
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

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error("Error creating review:", error)
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const authResult = await requireAuthenticatedUser(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { searchParams } = new URL(request.url)
    const requestedUserId = searchParams.get("userId")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")

    const canViewAll = ["admin", "super_admin"].includes(authResult.role)
    const whereClause =
      requestedUserId && canViewAll
        ? { userId: requestedUserId }
        : { userId: authResult.dbUser.id }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: whereClause,
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
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where: whereClause }),
    ])

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
  }
}
