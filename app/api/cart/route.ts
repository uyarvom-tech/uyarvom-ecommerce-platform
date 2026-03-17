import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuthenticatedUser } from "@/lib/auth-middleware"

export async function GET(request: NextRequest) {
  const authResult = await requireAuthenticatedUser(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: authResult.authUser.id },
    include: {
      product: {
        include: {
          images: {
            orderBy: { sortOrder: "asc" },
          },
          productCategories: {
            include: {
              category: true,
            },
            orderBy: { isPrimary: "desc" },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ items: cartItems })
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuthenticatedUser(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const body = await request.json()
    const productId = body.productId
    const variantId = body.variantId || null
    const requestedQuantity = Number(body.quantity ?? 1)

    if (!productId) {
      return NextResponse.json({ error: "Product is required" }, { status: 400 })
    }

    // Check product/variant availability
    let availableStock = 0
    let isActive = false

    if (variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        include: { product: true }
      })
      if (!variant || !variant.isActive || !variant.product.isActive) {
        return NextResponse.json({ error: "Variant not available" }, { status: 404 })
      }
      availableStock = variant.stock
      isActive = true
    } else {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, isActive: true, stockQuantity: true }
      })
      if (!product || !product.isActive) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }
      availableStock = product.stockQuantity
      isActive = true
    }

    if (availableStock <= 0) {
      return NextResponse.json({ error: "Selection is out of stock" }, { status: 409 })
    }

    const quantity = Math.max(1, Math.min(Math.trunc(requestedQuantity || 1), availableStock))

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        userId: authResult.authUser.id,
        productId,
        productVariantId: variantId,
      },
    })

    if (existingItem) {
      const nextQuantity = Math.min(existingItem.quantity + quantity, availableStock)

      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: nextQuantity },
      })

      return NextResponse.json({ item: updatedItem })
    }

    const cartItem = await prisma.cartItem.create({
      data: {
        userId: authResult.authUser.id,
        productId,
        productVariantId: variantId,
        quantity,
      },
    })

    return NextResponse.json({ item: cartItem }, { status: 201 })
  } catch (error) {
    console.error("Error adding to cart:", error)
    return NextResponse.json({ error: "Failed to add item to cart" }, { status: 500 })
  }
}
