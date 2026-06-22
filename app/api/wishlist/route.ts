import { NextRequest, NextResponse } from "next/server"
import { addWishlistItem, getWishlistItemForUser, getWishlistItemsForUser, removeWishlistItem } from "@/lib/wishlist"
import { requireAuthenticatedUser } from "@/lib/auth-middleware"

export async function GET(request: NextRequest) {
  const authResult = await requireAuthenticatedUser(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const productId = request.nextUrl.searchParams.get("productId")

  if (productId) {
    const item = await getWishlistItemForUser(authResult.authUser.id, productId)
    return NextResponse.json({ isInWishlist: !!item, item })
  }

  const items = await getWishlistItemsForUser(authResult.authUser.id)
  return NextResponse.json({ items })
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuthenticatedUser(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const body = await request.json().catch(() => ({}))
    const productId = body.productId

    if (!productId) {
      return NextResponse.json({ error: "Product is required" }, { status: 400 })
    }

    const item = await addWishlistItem(authResult.authUser.id, productId)

    if (!item) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ item, created: true }, { status: 201 })
  } catch (error) {
    console.error("Wishlist add error:", error)
    return NextResponse.json({ error: "Failed to update wishlist" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireAuthenticatedUser(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const body = await request.json().catch(() => ({}))
    const productId = body.productId || request.nextUrl.searchParams.get("productId")

    if (!productId) {
      return NextResponse.json({ error: "Product is required" }, { status: 400 })
    }

    await removeWishlistItem(authResult.authUser.id, productId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Wishlist remove error:", error)
    return NextResponse.json({ error: "Failed to update wishlist" }, { status: 500 })
  }
}
