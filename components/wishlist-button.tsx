"use client"

import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

/**
 * Global wishlist cache — fetched ONCE, shared across all buttons.
 * Proper in-flight dedup prevents the request flood.
 */
let wishlistCache: Set<string> | null = null
let wishlistFetchPromise: Promise<Set<string>> | null = null
let lastFetchTime = 0
const CACHE_TTL = 30_000 // Cache valid for 30 seconds

async function getWishlistCache(): Promise<Set<string>> {
  const now = Date.now()

  // 1. Fresh cache hit — return immediately
  if (wishlistCache && (now - lastFetchTime) < CACHE_TTL) {
    return wishlistCache
  }

  // 2. A fetch is already in flight — ALWAYS reuse it (this is the dedup that
  //    prevents 150 buttons from each firing their own request)
  if (wishlistFetchPromise) {
    return wishlistFetchPromise
  }

  // 3. Start exactly one new fetch
  wishlistFetchPromise = fetch('/api/wishlist', { credentials: 'include' })
    .then(async (res) => {
      if (!res.ok) {
        wishlistCache = new Set<string>()
        return wishlistCache
      }
      const data = await res.json()
      const items = data.items || data.wishlist || []
      wishlistCache = new Set<string>(items.map((item: any) => item.productId || item.product_id || item.id))
      return wishlistCache
    })
    .catch(() => {
      wishlistCache = new Set<string>()
      return wishlistCache
    })
    .finally(() => {
      lastFetchTime = Date.now()
      wishlistFetchPromise = null // Clear so a fetch after TTL can run again
    })

  return wishlistFetchPromise
}

// Invalidate cache when wishlist changes
function invalidateWishlistCache() {
  wishlistCache = null
  lastFetchTime = 0
  wishlistFetchPromise = null
}

export function WishlistButton({ productId, className }: { productId: string; className?: string }) {
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let mounted = true
    getWishlistCache().then((cache) => {
      if (mounted) setIsInWishlist(cache.has(productId))
    })
    return () => { mounted = false }
  }, [productId])

  // Listen for wishlist changes from other buttons (local state only, no re-fetch)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.productId === productId) {
        setIsInWishlist(detail.added)
      }
    }
    window.addEventListener('wishlist:changed', handler)
    return () => window.removeEventListener('wishlist:changed', handler)
  }, [productId])

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      })

      if (!response.ok) throw new Error("Failed to update wishlist")

      setIsInWishlist(!isInWishlist)
      invalidateWishlistCache()
      window.dispatchEvent(new CustomEvent("wishlist:changed", { detail: { productId, added: !isInWishlist } }))
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
