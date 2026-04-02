"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Minus, Plus, ShoppingCart } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { getDefaultVariant } from "@/lib/variant-stock"

export function AddToCartButton({
  product,
  variantId,
  stockOverride
}: {
  product: any,
  variantId?: string,
  stockOverride?: number
}) {
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const variantLookup = (product.colors || [])
    .flatMap((color: any) => color.variants || [])
    .find((variant: any) => variant.id === variantId)
  const defaultVariant = variantId ? variantLookup : getDefaultVariant(product)
  const stockQuantity = stockOverride !== undefined
    ? stockOverride
    : Number(defaultVariant?.stock ?? 0)

  const handleAddToCart = async () => {
    setIsLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setIsLoading(false)
      router.push(`/auth/login?redirect=/products/${product.slug}`)
      return
    }

    const resolvedVariantId = variantId || defaultVariant?.id
    if (!resolvedVariantId) {
      setIsLoading(false)
      toast.error("Please select a variant before adding to cart")
      return
    }

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          variantId: resolvedVariantId,
          quantity,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || "Failed to add to cart")
      }

      toast.success("Added to cart!")
      setQuantity(1)
      router.refresh()
    } catch (error) {
      console.error("Add to cart error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to add to cart")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex gap-3">
      <div className="flex items-center rounded-md border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          disabled={quantity <= 1}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-12 text-center font-medium">{quantity}</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setQuantity(Math.min(stockQuantity, quantity + 1))}
          disabled={quantity >= stockQuantity}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Button
        onClick={handleAddToCart}
        disabled={isLoading || stockQuantity <= 0}
        className="flex-1 rounded-none uppercase text-[10px] font-bold tracking-widest h-12"
        size="lg"
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        {stockQuantity <= 0 ? "Out of Stock" : isLoading ? "Adding..." : "Add to Cart"}
      </Button>
    </div>
  )
}
