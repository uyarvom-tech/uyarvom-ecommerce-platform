"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Minus, ShoppingCart } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function AddToCartButton({ product }: { product: any }) {
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleAddToCart = async () => {
    setIsLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push(`/auth/login?redirect=/products/${product.slug}`)
      return
    }

    // Check if item already in cart
    const { data: existingItem } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .is("variant_id", null)
      .single()

    if (existingItem) {
      // Update quantity
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: existingItem.quantity + quantity })
        .eq("id", existingItem.id)

      if (error) {
        toast.error("Failed to update cart")
        setIsLoading(false)
        return
      }
    } else {
      // Insert new item
      const { error } = await supabase.from("cart_items").insert({
        user_id: user.id,
        product_id: product.id,
        quantity,
      })

      if (error) {
        toast.error("Failed to add to cart")
        setIsLoading(false)
        return
      }
    }

    toast.success("Added to cart!")
    setIsLoading(false)
    setQuantity(1)
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
          onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
          disabled={quantity >= product.stock_quantity}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Button
        onClick={handleAddToCart}
        disabled={isLoading || product.stock_quantity <= 0}
        className="flex-1"
        size="lg"
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        {product.stock_quantity <= 0 ? "Out of Stock" : isLoading ? "Adding..." : "Add to Cart"}
      </Button>
    </div>
  )
}
