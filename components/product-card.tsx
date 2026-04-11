"use client"

import Link from "next/link"
import Image from "next/image"
import { ShoppingCart, Star } from "lucide-react"
import { memo, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { FlexibleProduct, ProductImage } from "@/types"
import { PRODUCT_FALLBACK_IMAGE } from "@/lib/image-fallbacks"
import { Button } from "@/components/ui/button"
import { getDefaultVariant, getVariantStockSummary } from "@/lib/variant-stock"
import { WishlistButton } from "@/components/wishlist-button"

interface ProductCardProps {
  product: FlexibleProduct
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  const { displayImages, mainImages } = useMemo(() => {
    const productImages = product.images || []
    const filteredImages = productImages.filter((img: any) => {
      if (typeof img === "string") {
        return img && img.trim() !== ""
      }

      return img && (img.imageUrl || img.image_url) && (img.imageUrl || img.image_url)!.trim() !== ""
    })

    const mappedImages: ProductImage[] =
      filteredImages.length > 0
        ? filteredImages.map((img: any) => {
            if (typeof img === "string") {
              return { imageUrl: img, altText: product.name }
            }

            return img
          })
        : [{ imageUrl: PRODUCT_FALLBACK_IMAGE, altText: product.name }]

    return {
      displayImages: mappedImages,
      mainImages: filteredImages,
    }
  }, [product.images, product.name])

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
  const stockSummary = useMemo(() => getVariantStockSummary(product as any), [product])
  const defaultVariant = useMemo(() => getDefaultVariant(product as any), [product])
  const stockQuantity = stockSummary.total
  const lowStockThreshold = Number(product.lowStockThreshold ?? product.low_stock_threshold ?? 10)
  const isLowStock = stockQuantity <= lowStockThreshold && stockQuantity > 0
  const createdDate = product.createdAt || (product.created_at ? new Date(product.created_at) : new Date())
  const isNew = createdDate > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const primaryCategory = product.productCategories?.[0]?.category?.name || "Curated Pick"

  const handleAddToCart = async () => {
    if (!product.id || stockQuantity <= 0 || isAdding || !defaultVariant?.id) return

    setIsAdding(true)

    const { createClient } = await import("@/lib/supabase/client")
    const supabase = createClient()
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
      className="overflow-hidden rounded-[24px] border border-border/60 bg-white shadow-sm transition-transform duration-300 active:scale-[0.99] md:p-2 md:hover:-translate-y-1 md:hover:shadow-xl"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="md:hidden aspect-square overflow-hidden rounded-[22px] border border-border/50 bg-white">
        <div className="flex h-full flex-col">
          <Link href={`/products/${product.slug}`} className="block h-[58%]">
            <div className="relative h-full overflow-hidden bg-secondary">
            <div className="absolute left-2 top-2 z-10 flex max-w-[72%] flex-wrap gap-1">
              {stockQuantity > 0 && (
                <span className={`rounded-full px-2 py-1 text-[8px] font-bold uppercase tracking-[0.14em] ${isLowStock ? "bg-foreground text-white" : "bg-white/95 text-foreground"}`}>
                  {stockQuantity} in stock
                </span>
              )}
            </div>

            <div className="absolute right-2 top-2 z-10">
              <WishlistButton
                productId={product.id}
                className="h-8 w-8 rounded-xl border border-white/40 bg-white/85 text-foreground backdrop-blur transition-all active:scale-95"
              />
            </div>

            {displayImages.map((image, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-700 ${index === currentImageIndex ? "opacity-100" : "opacity-0"}`}
              >
                <Image
                  src={image?.imageUrl || image?.image_url || PRODUCT_FALLBACK_IMAGE}
                  alt={image?.altText || image?.alt_text || product.name}
                  width={480}
                  height={480}
                  sizes="33vw"
                  className="h-full w-full object-cover object-center transition-transform duration-700"
                />
              </div>
            ))}

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent p-2">
              <div className="flex items-end justify-between gap-2">
                <div className="rounded-full bg-white/90 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.14em] text-foreground">
                  {primaryCategory}
                </div>
              </div>
            </div>

            {stockQuantity <= 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[2px]">
                <span className="rounded-full bg-foreground px-3 py-1 text-[8px] font-bold uppercase tracking-[0.22em] text-white">
                  Out
                </span>
              </div>
            )}
            </div>
          </Link>

          <div className="flex flex-[0_0_42%] flex-col justify-between gap-1 px-2.5 pb-2.5 pt-2">
            <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-primary">{primaryCategory}</p>
            <Link href={`/products/${product.slug}`} className="block">
              <h3 className="line-clamp-2 text-[12px] font-semibold leading-snug text-foreground">
                {product.name}
              </h3>
            </Link>

            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[14px] font-bold tracking-tight text-foreground">{"\u20B9"}{currentPrice.toLocaleString("en-IN")}</span>
                  {hasDiscount && (
                    <span className="text-[10px] text-muted-foreground line-through">{"\u20B9"}{comparePrice?.toLocaleString("en-IN")}</span>
                  )}
                </div>
              </div>

              <Button
                type="button"
                onClick={handleAddToCart}
                disabled={stockQuantity <= 0 || isAdding}
                className="h-8 rounded-full bg-primary px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white transition-all active:scale-95"
              >
                {stockQuantity <= 0 ? "Sold" : isAdding ? "..." : "Add"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:block">
        <Link href={`/products/${product.slug}`} className="group block">
          <div className="relative mb-3 aspect-[4/5] overflow-hidden rounded-[20px] bg-secondary md:mb-4">
            <div className="absolute left-2.5 top-2.5 z-10 flex max-w-[68%] flex-wrap gap-1.5 md:left-3 md:top-3 md:max-w-[60%] md:gap-2">
              {hasDiscount && (
                <span className="rounded-full bg-[#b91c1c] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white md:px-3 md:text-[10px] md:tracking-[0.18em]">
                  {discountPercent}% Off
                </span>
              )}
              {isNew && (
                <span className="rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-foreground md:px-3 md:text-[10px] md:tracking-[0.18em]">
                  New
                </span>
              )}
              {stockQuantity > 0 && (
                <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] md:px-3 md:text-[10px] md:tracking-[0.18em] ${isLowStock ? "bg-foreground text-white" : "bg-white/95 text-foreground"}`}>
                  {stockQuantity} in stock
                </span>
              )}
            </div>

            <div className="absolute right-2.5 top-2.5 z-10 md:right-3 md:top-3">
              <WishlistButton
                productId={product.id}
                className="h-9 w-9 rounded-xl border border-white/40 bg-white/80 text-foreground backdrop-blur transition-all duration-300 hover:bg-primary hover:text-white md:h-10 md:w-10"
              />
            </div>

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
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="h-full w-full object-cover object-center transition-transform duration-1000 group-hover:scale-105"
                />
              </div>
            ))}

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent p-3 md:p-4">
              <div className="flex items-end justify-between gap-3">
                <div className="rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-foreground md:px-3 md:text-[10px] md:tracking-[0.18em]">
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

        <div className="flex min-h-[220px] flex-col space-y-2.5 px-1 pb-1 md:min-h-[248px] md:space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-primary md:text-[10px] md:tracking-[0.22em]">{primaryCategory}</p>
              <Link href={`/products/${product.slug}`} className="block">
                <h3 className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug text-foreground transition-colors duration-300 hover:text-primary md:text-xl">
                  {product.name}
                </h3>
              </Link>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700 md:px-2.5 md:text-[11px]">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span>4.8</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-muted-foreground md:gap-2 md:text-[11px]">
            {hasDiscount ? (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 md:px-3">
                Save {"\u20B9"}{savings.toLocaleString("en-IN")}
              </span>
            ) : (
              <span className="rounded-full bg-secondary px-2.5 py-1 text-foreground/70 md:px-3">Everyday value</span>
            )}
            <span className="rounded-full bg-secondary px-2.5 py-1 text-foreground/70 md:px-3">Fast shipping</span>
          </div>

          <div className="mt-auto border-t border-border/50 pt-3">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold tracking-tight text-foreground md:text-xl">{"\u20B9"}{currentPrice.toLocaleString("en-IN")}</span>
                  {hasDiscount && (
                    <span className="text-xs text-muted-foreground line-through md:text-sm">{"\u20B9"}{comparePrice?.toLocaleString("en-IN")}</span>
                  )}
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground md:text-[11px]">
                  {stockQuantity > 0 ? `${stockQuantity} available` : "Out of stock"}
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleAddToCart}
              disabled={stockQuantity <= 0 || isAdding}
              className="mt-4 h-10 w-full rounded-2xl bg-primary text-[10px] font-bold uppercase tracking-[0.16em] text-white transition-all hover:bg-foreground md:h-11 md:text-[11px] md:tracking-[0.18em]"
            >
              <ShoppingCart className="mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
              {stockQuantity <= 0 ? "Sold Out" : isAdding ? "Adding..." : "Add To Cart"}
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}

export const MemoizedProductCard = memo(ProductCard)
