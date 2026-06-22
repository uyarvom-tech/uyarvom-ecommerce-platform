'use client'

import { useMemo } from 'react'
import ProductSizeSelector from './product-size-selector'
import { AddToCartButton } from './add-to-cart-button'
import { useProductVariantContext } from './product-variant-context'

export function ProductActionArea({ product, hasDiscount }: { product: any; hasDiscount: boolean }) {
  const { selectedColor, selectedVariantId, setSelectedVariantId } = useProductVariantContext()

  const sizeOptions = useMemo(() => {
    return (selectedColor?.variants || []).map((variant: any) => ({
      id: variant.id,
      size: variant.size,
      price: variant.price ?? null,
      stock: variant.stock,
      isActive: variant.isActive,
      sku: variant.sku,
    }))
  }, [selectedColor])

  const selectedVariant = selectedColor?.variants.find((variant: any) => variant.id === selectedVariantId)
  const dynamicPrice = selectedVariant?.price ?? product.price
  const dynamicStock = selectedVariant?.stock ?? 0

  return (
    <div className="flex flex-col space-y-5 md:space-y-10">
      <div className="group border-y border-border px-0 py-5 transition-all duration-500 hover:bg-secondary/50 sm:px-2 md:py-10">
        <div className="flex items-baseline gap-2.5 md:gap-4">
          <span className="text-2xl font-serif text-foreground sm:text-3xl md:text-4xl">Rs.{dynamicPrice.toLocaleString('en-IN')}</span>
          {hasDiscount && product.compareAtPrice && dynamicPrice === product.price && (
            <span className="text-sm font-light text-foreground/30 line-through sm:text-base md:text-xl">
              Rs.{product.compareAtPrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>
        <p className="mt-1.5 text-[9px] uppercase tracking-[0.16em] text-foreground/55 sm:text-[10px] md:mt-2 md:text-[11px]">
          {dynamicStock > 0 ? `${dynamicStock} left for this size` : "Out of stock"}
        </p>
        <p className="mt-1.5 text-[8px] uppercase leading-snug tracking-widest text-foreground/40 sm:text-[9px] md:mt-2 md:text-[10px]">
          Complimentary artisan shipping within India
        </p>
      </div>

      {product.shortDescription && (
        <p className="text-sm leading-relaxed text-foreground/70 font-light italic sm:text-base md:text-lg">
          &ldquo;{product.shortDescription}&rdquo;
        </p>
      )}

      <div className="space-y-4 pt-1 md:space-y-8 md:pt-4">
        <ProductSizeSelector
          sizes={sizeOptions}
          selectedVariantId={selectedVariantId}
          onSizeChange={setSelectedVariantId}
        />

        <div className="flex flex-col gap-2.5 md:gap-4">
          <AddToCartButton
            product={product}
            variantId={selectedVariantId || undefined}
            stockOverride={dynamicStock}
          />
          <p className="text-center text-[8px] font-medium uppercase tracking-[0.18em] text-foreground/40 sm:text-[9px] md:text-[10px]">
            Secure checkout with artisanal handling
          </p>
        </div>
      </div>
    </div>
  )
}
