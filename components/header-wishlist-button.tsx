"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export function HeaderWishlistButton() {
  const [count, setCount] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  const loadWishlistCount = useCallback(async () => {
    try {
      const response = await fetch("/api/wishlist", { credentials: "include" })
      if (!response.ok) {
        setCount(0)
        return
      }

      const data = await response.json()
      const nextCount = Array.isArray(data.items) ? data.items.length : 0
      setCount(nextCount)
    } catch {
      setCount(0)
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()
    setMounted(true)
    void loadWishlistCount()

    const handleWishlistChange = () => {
      void loadWishlistCount()
    }

    const handleFocus = () => {
      void loadWishlistCount()
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      void loadWishlistCount()
    })

    window.addEventListener("wishlist:changed", handleWishlistChange)
    window.addEventListener("focus", handleFocus)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener("wishlist:changed", handleWishlistChange)
      window.removeEventListener("focus", handleFocus)
    }
  }, [loadWishlistCount])

  return (
    <Button
      variant="ghost"
      size="icon"
      className="group relative h-11 w-11 rounded-full border border-transparent transition-all duration-300 hover:border-primary/20 hover:bg-white"
      asChild
    >
      <Link href="/wishlist">
        <Heart className="h-5 w-5 text-foreground transition-all duration-300 group-hover:text-primary" />
        <span className="sr-only">Favorites</span>
        {mounted && count !== null && count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white transition-all scale-100 animate-in fade-in zoom-in duration-300">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Link>
    </Button>
  )
}
