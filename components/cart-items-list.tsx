"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Minus, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PRODUCT_FALLBACK_IMAGE } from "@/lib/image-fallbacks"

export function CartItemsList({ items }: { items: any[] }) {
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())
  const router = useRouter()

  const setUpdating = (itemId: string, updating: boolean) => {
    setUpdatingItems((prev) => {
      const next = new Set(prev)
      if (updating) {
        next.add(itemId)
      } else {
        next.delete(itemId)
      }
      return next
    })
  }

  const updateQuantity = async (itemId: string, newQuantity: number, maxStock: number) => {
    if (newQuantity < 1 || newQuantity > maxStock) return

    setUpdating(itemId, true)

    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity: newQuantity }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || "Failed to update quantity")
      }

      router.refresh()
    } catch (error) {
      console.error("Cart update error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update quantity")
    } finally {
      setUpdating(itemId, false)
    }
  }

  const removeItem = async (itemId: string) => {
    setUpdating(itemId, true)

    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || "Failed to remove item")
      }

      toast.success("Item removed from cart")
      router.refresh()
    } catch (error) {
      console.error("Cart remove error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to remove item")
      setUpdating(itemId, false)
    }
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const product = item.product
        const productVariant = item.productVariant
        const primaryImage =
          product.images?.find((img: any) => img.isPrimary || img.is_primary) || product.images?.[0]
        const imageUrl = primaryImage?.imageUrl || primaryImage?.image_url
        const stockQuantity = Number(productVariant?.stock ?? 0)
        const primaryCategory =
          product.productCategories?.find((entry: any) => entry.isPrimary)?.category ||
          product.productCategories?.[0]?.category
        const isUpdating = updatingItems.has(item.id)

        return (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <Link href={`/products/${product.slug}`} className="flex-shrink-0">
                  <div className="h-24 w-24 overflow-hidden rounded-md bg-muted">
                    <Image
                      src={imageUrl || PRODUCT_FALLBACK_IMAGE}
                      alt={product.name}
                      width={100}
                      height={100}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </Link>

                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <Link href={`/products/${product.slug}`} className="hover:underline">
                      <h3 className="font-semibold">{product.name}</h3>
                    </Link>
                    <p className="text-sm text-muted-foreground">{primaryCategory?.name}</p>
                    {productVariant && (
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">
                        {productVariant.color?.colorName || "Variant"} / {productVariant.size}
                      </p>
                    )}
                    <p className="mt-1 font-semibold">₹{Number(product.price || 0).toLocaleString("en-IN")}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center rounded-md border">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity - 1, stockQuantity)}
                        disabled={isUpdating || item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity + 1, stockQuantity)}
                        disabled={isUpdating || item.quantity >= stockQuantity}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-4">
                      <p className="font-bold">₹{(Number(product.price || 0) * item.quantity).toLocaleString("en-IN")}</p>
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
