"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Minus, Plus, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function CartItemsList({ items }: { items: any[] }) {
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())
  const router = useRouter()
  const supabase = createClient()

  const updateQuantity = async (itemId: string, newQuantity: number, maxStock: number) => {
    if (newQuantity < 1 || newQuantity > maxStock) return
    setUpdatingItems((prev) => new Set(prev).add(itemId))

    // @ts-ignore
    const { error } = await supabase.from("cart_items").update({ quantity: newQuantity }).eq("id", itemId)

    if (error) {
      toast.error("Failed to update quantity")
    } else {
      router.refresh()
    }

    setUpdatingItems((prev) => {
      const next = new Set(prev)
      next.delete(itemId)
      return next
    })
  }

  const removeItem = async (itemId: string) => {
    setUpdatingItems((prev) => new Set(prev).add(itemId))

    // @ts-ignore
    const { error } = await supabase.from("cart_items").delete().eq("id", itemId)

    if (error) {
      toast.error("Failed to remove item")
      setUpdatingItems((prev) => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    } else {
      toast.success("Item removed from cart")
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const primaryImage = item.product.images?.find((img: any) => img.is_primary) || item.product.images?.[0]
        const isUpdating = updatingItems.has(item.id)

        return (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <Link href={`/products/${item.product.slug}`} className="flex-shrink-0">
                  <div className="h-24 w-24 overflow-hidden rounded-md bg-muted">
                    <Image
                      src={
                        primaryImage?.image_url || `/placeholder.svg?height=100&width=100&query=${item.product.name}`
                      }
                      alt={item.product.name}
                      width={100}
                      height={100}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </Link>

                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <Link href={`/products/${item.product.slug}`} className="hover:underline">
                      <h3 className="font-semibold">{item.product.name}</h3>
                    </Link>
                    <p className="text-sm text-muted-foreground">{item.product.category?.name}</p>
                    <p className="mt-1 font-semibold">₹{item.product.price.toLocaleString("en-IN")}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center rounded-md border">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity - 1, item.product.stock_quantity)}
                        disabled={isUpdating || item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity + 1, item.product.stock_quantity)}
                        disabled={isUpdating || item.quantity >= item.product.stock_quantity}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-4">
                      <p className="font-bold">₹{(item.product.price * item.quantity).toLocaleString("en-IN")}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                        disabled={isUpdating}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
