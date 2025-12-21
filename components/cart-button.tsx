"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function CartButton({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel("cart_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "cart_items" }, async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const { count: newCount } = await supabase
            .from("cart_items")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
          setCount(newCount || 0)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return (
    <Button variant="ghost" size="icon" className="relative" asChild>
      <Link href="/cart">
        <ShoppingCart className="h-5 w-5" />
        {count > 0 && (
          <Badge className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full p-0 text-xs">
            {count}
          </Badge>
        )}
      </Link>
    </Button>
  )
}
