import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuthenticatedUser } from "@/lib/auth-middleware"
import { getDefaultVariant } from "@/lib/variant-stock"

export async function GET(request: NextRequest) {
  const authResult = await requireAuthenticatedUser(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: authResult.authUser.id },
    include: {
      productVariant: {
        include: {
          color: true,
        },
      },
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

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        colors: {
          orderBy: { sortOrder: "asc" },
          include: {
            variants: {
              where: { isActive: true },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    })

    if (!product || !product.isActive) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    let variant: any = null

    if (variantId) {
      variant = await prisma.productVariant.findFirst({
        where: {
          id: variantId,
          productId,
        },
        include: {
          product: true,
          color: true,
        },
      })
    } else {
      variant = getDefaultVariant(product as any) as any
      if (variant?.id) {
        variant = await prisma.productVariant.findFirst({
          where: {
            id: variant.id,
            productId,
          },
          include: {
            product: true,
            color: true,
          },
        })
      }
    }

    if (!variant || !variant.isActive || !variant.product.isActive) {
      return NextResponse.json({ error: "Please select a valid size variant" }, { status: 404 })
    }

    const availableStock = Number(variant.stock || 0)

    if (availableStock <= 0) {
      return NextResponse.json({ error: "Selection is out of stock" }, { status: 409 })
    }

    const quantity = Math.max(1, Math.min(Math.trunc(requestedQuantity || 1), availableStock))

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        userId: authResult.authUser.id,
        productId,
        productVariantId: variant.id,
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
        productVariantId: variant.id,
        quantity,
      },
    })

    return NextResponse.json({ item: cartItem }, { status: 201 })
  } catch (error) {
    console.error("Error adding to cart:", error)
    return NextResponse.json({ error: "Failed to add item to cart" }, { status: 500 })
  }
}
