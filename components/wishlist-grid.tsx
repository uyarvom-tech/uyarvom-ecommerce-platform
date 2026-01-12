"use client"

import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Trash2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface WishlistItem {
  id: string
  product: {
    id: string
    name: string
    slug: string
    price: number
    compare_at_price?: number
    short_description?: string
    stock_quantity: number
    category?: { name: string; slug: string }
    images: Array<{ image_url: string; alt_text?: string; is_primary: boolean }>
  }
}

export function WishlistGrid({ items }: { items: WishlistItem[] }) {
  const [wishlistItems, setWishlistItems] = useState(items)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const removeFromWishlist = async (wishlistId: string, productId: string) => {
    setRemovingId(productId)
    const { error } = await supabase.from("wishlists").delete().eq("id", wishlistId)

    if (!error) {
      setWishlistItems(wishlistItems.filter((item) => item.id !== wishlistId))
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
            onClick={() => removeFromWishlist(item.id, item.product.id)}
            disabled={removingId === item.product.id}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}
