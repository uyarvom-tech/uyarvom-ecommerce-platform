"use client"

import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export function WishlistButton({ productId, className }: { productId: string; className?: string }) {
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    checkWishlist()
  }, [productId])

  const checkWishlist = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("wishlists")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .single()

    setIsInWishlist(!!data)
  }

  const toggleWishlist = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login?redirect=/products")
      return
    }

    setIsLoading(true)

    if (isInWishlist) {
      await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", productId)
      setIsInWishlist(false)
    } else {
      await supabase.from("wishlists").insert({ user_id: user.id, product_id: productId })
      setIsInWishlist(true)
    }

    setIsLoading(false)
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleWishlist}
      disabled={isLoading}
      className={className}
      aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart className={`h-5 w-5 ${isInWishlist ? "fill-red-500 text-red-500" : ""}`} />
    </Button>
  )
}
