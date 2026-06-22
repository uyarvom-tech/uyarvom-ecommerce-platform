"use client"

import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { WishlistEntry } from "@/lib/wishlist"

export function WishlistGrid({ items }: { items: WishlistEntry[] }) {
  const [wishlistItems, setWishlistItems] = useState(items)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    setWishlistItems(items)
  }, [items])

  const removeFromWishlist = async (productId: string) => {
    setRemovingId(productId)

    try {
      const response = await fetch("/api/wishlist", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      })

      if (!response.ok) {
        throw new Error("Failed to remove wishlist item")
      }

      setWishlistItems(wishlistItems.filter((item) => item.productId !== productId))
      router.refresh()
    } catch (error) {
      console.error("Wishlist remove error:", error)
    }

    setRemovingId(null)
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {wishlistItems.map((item) => (
        <div key={item.id} className="group relative">
          <ProductCard product={item.product} />
          <Button
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2 opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
            onClick={() => removeFromWishlist(item.productId)}
            disabled={removingId === item.productId}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}
