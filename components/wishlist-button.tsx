"use client"

import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function WishlistButton({ productId, className }: { productId: string; className?: string }) {
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    checkWishlist()
  }, [productId])

  const checkWishlist = async () => {
    try {
      const response = await fetch(`/api/wishlist?productId=${encodeURIComponent(productId)}`)

      if (!response.ok) {
        setIsInWishlist(false)
        return
      }

      const payload = await response.json()
      setIsInWishlist(Boolean(payload.isInWishlist))
    } catch {
      setIsInWishlist(false)
    }
  }

  const toggleWishlist = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`)
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/wishlist", {
        method: isInWishlist ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      })

      if (!response.ok) {
        throw new Error("Failed to update wishlist")
      }

      setIsInWishlist(!isInWishlist)
      window.dispatchEvent(new CustomEvent("wishlist:changed"))
      router.refresh()
    } catch (error) {
      console.error("Wishlist toggle error:", error)
    }

    setIsLoading(false)
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        toggleWishlist()
      }}
      disabled={isLoading}
      className={className}
      aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={isInWishlist}
    >
      <Heart className={`h-5 w-5 ${isInWishlist ? "fill-red-500 text-red-500" : ""}`} />
    </Button>
  )
}
