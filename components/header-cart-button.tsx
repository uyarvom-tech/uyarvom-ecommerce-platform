"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeaderCartButton() {
  const [count, setCount] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  const loadCartCount = useCallback(async () => {
    try {
      const response = await fetch("/api/cart", { credentials: "include" })
      if (!response.ok) {
        setCount(0)
        return
      }

      const data = await response.json()
      const nextCount = Array.isArray(data.items)
        ? data.items.reduce((sum: number, item: { quantity?: number }) => sum + Number(item.quantity || 0), 0)
        : 0

      setCount(nextCount)
    } catch {
      setCount(0)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    void loadCartCount()

    const handleCartChange = () => {
      void loadCartCount()
    }

    window.addEventListener("cart:changed", handleCartChange)
    window.addEventListener("focus", handleCartChange)

    return () => {
      window.removeEventListener("cart:changed", handleCartChange)
      window.removeEventListener("focus", handleCartChange)
    }
  }, [loadCartCount])

  return (
    <Button
      variant="ghost"
      size="icon"
      className="group relative h-11 w-11 rounded-full border border-transparent transition-all duration-300 hover:border-primary/20 hover:bg-white"
      asChild
    >
      <Link href="/cart">
        <ShoppingBag className="h-5 w-5 text-foreground transition-all duration-300 group-hover:text-primary" />
        <span className="sr-only">Cart</span>
        {mounted && count !== null && count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white transition-all scale-100 animate-in fade-in zoom-in duration-300">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Link>
    </Button>
  )
}
