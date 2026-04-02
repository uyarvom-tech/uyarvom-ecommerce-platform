'use client'

import Link from "next/link"
import Image from "next/image"
import { Heart, ShoppingCart, Star } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { FlexibleProduct, ProductImage } from "@/types"
import { PRODUCT_FALLBACK_IMAGE } from "@/lib/image-fallbacks"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { getDefaultVariant, getVariantStockSummary } from "@/lib/variant-stock"

interface ProductCardProps {
  product: FlexibleProduct
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter()
  const supabase = createClient()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  const productImages = product.images || []
  const mainImages = productImages.filter((img: any) => {
    if (typeof img === "string") {
      return img && img.trim() !== ""
    }

    return img && (img.imageUrl || img.image_url) && (img.imageUrl || img.image_url)!.trim() !== ""
  })

  const displayImages: ProductImage[] =
    mainImages.length > 0
      ? mainImages.map((img: any) => {
          if (typeof img === "string") {
            return { imageUrl: img, altText: product.name }
          }

          return img
        })
      : [{ imageUrl: PRODUCT_FALLBACK_IMAGE, altText: product.name }]

  useEffect(() => {
    if (!isHovering || mainImages.length <= 1) return

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % mainImages.length)
    }, 2200)

    return () => clearInterval(interval)
  }, [isHovering, mainImages.length])

  useEffect(() => {
    if (!isHovering) setCurrentImageIndex(0)
  }, [isHovering])

  const currentPrice = Number(product.price || 0)
  const comparePriceRaw = product.compareAtPrice ?? product.compare_at_price
  const comparePrice = comparePriceRaw == null ? null : Number(comparePriceRaw)
  const hasDiscount = Boolean(comparePrice && comparePrice > currentPrice)
  const savings = hasDiscount ? Math.max(0, Math.round(comparePrice! - currentPrice)) : 0
  const discountPercent = hasDiscount ? Math.round(((comparePrice! - currentPrice) / comparePrice!) * 100) : 0
  const stockSummary = getVariantStockSummary(product as any)
  const defaultVariant = getDefaultVariant(product as any)
  const stockQuantity = stockSummary.total
  const lowStockThreshold = Number(product.lowStockThreshold ?? product.low_stock_threshold ?? 10)
  const isLowStock = stockQuantity <= lowStockThreshold && stockQuantity > 0
  const createdDate = product.createdAt || (product.created_at ? new Date(product.created_at) : new Date())
  const isNew = createdDate > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const primaryCategory = product.productCategories?.[0]?.category?.name || "Curated Pick"

  const handleAddToCart = async () => {
    if (!product.id || stockQuantity <= 0 || isAdding || !defaultVariant?.id) return

    setIsAdding(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setIsAdding(false)
      router.push(`/auth/login?redirect=/products/${product.slug}`)
      return
    }

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          variantId: defaultVariant.id,
          quantity: 1,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || "Failed to add to cart")
      }

      toast.success("Added to cart")
      window.dispatchEvent(new CustomEvent("cart:changed"))
      router.refresh()
    } catch (error) {
      console.error("Add to cart error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to add to cart")
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <article
      className="rounded-[24px] border border-border/60 bg-white p-2 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Link href={`/products/${product.slug}`} className="group block">
        <div className="relative mb-4 aspect-[4/5] overflow-hidden rounded-[20px] bg-secondary">
          <div className="absolute left-3 top-3 z-10 flex max-w-[60%] flex-wrap gap-2">
            {hasDiscount && (
              <span className="rounded-full bg-[#b91c1c] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                {discountPercent}% Off
              </span>
            )}
            {isNew && (
              <span className="rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-foreground">
                New
              </span>
            )}
            {isLowStock && (
              <span className="rounded-full bg-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                Only {stockQuantity} left
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
            }}
            className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-white/40 bg-white/80 text-foreground backdrop-blur transition-all duration-300 hover:bg-primary hover:text-white"
          >
            <Heart className="h-4 w-4" />
          </button>

          {displayImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-700 ${index === currentImageIndex ? "opacity-100" : "opacity-0"}`}
            >
              <Image
                src={image?.imageUrl || image?.image_url || PRODUCT_FALLBACK_IMAGE}
                alt={image?.altText || image?.alt_text || product.name}
                width={480}
                height={600}
                className="h-full w-full object-cover object-center transition-transform duration-1000 group-hover:scale-105"
              />
            </div>
          ))}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent p-4">
            <div className="flex items-end justify-between gap-3">
              <div className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-foreground">
                {primaryCategory}
              </div>
              {mainImages.length > 1 && (
                <div className="flex gap-1.5">
                  {mainImages.map((_, index) => (
                    <span
                      key={index}
                      className={`h-1.5 rounded-full transition-all ${index === currentImageIndex ? "w-5 bg-white" : "w-1.5 bg-white/45"}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {stockQuantity <= 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[2px]">
              <span className="rounded-full bg-foreground px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white">
                Out Of Stock
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="flex min-h-[248px] flex-col space-y-3 px-1 pb-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">{primaryCategory}</p>
            <Link href={`/products/${product.slug}`} className="block">
              <h3 className="mt-1 line-clamp-2 text-lg font-semibold leading-snug text-foreground transition-colors duration-300 hover:text-primary md:text-xl">
                {product.name}
              </h3>
            </Link>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span>4.8</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-muted-foreground">
          {hasDiscount ? (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
              Save {"\u20B9"}{savings.toLocaleString("en-IN")}
            </span>
          ) : (
            <span className="rounded-full bg-secondary px-3 py-1 text-foreground/70">Everyday value</span>
          )}
          <span className="rounded-full bg-secondary px-3 py-1 text-foreground/70">Fast shipping</span>
        </div>

        <div className="mt-auto border-t border-border/50 pt-3">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold tracking-tight text-foreground">{"\u20B9"}{currentPrice.toLocaleString("en-IN")}</span>
                {hasDiscount && (
                  <span className="text-sm text-muted-foreground line-through">{"\u20B9"}{comparePrice?.toLocaleString("en-IN")}</span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {stockQuantity > 0 ? "Ready to order" : "Notify me when back"}
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleAddToCart}
            disabled={stockQuantity <= 0 || isAdding}
            className="mt-4 h-11 w-full rounded-2xl bg-primary text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-all hover:bg-foreground"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {stockQuantity <= 0 ? "Sold Out" : isAdding ? "Adding..." : "Add To Cart"}
          </Button>
        </div>
      </div>
    </article>
  )
}
