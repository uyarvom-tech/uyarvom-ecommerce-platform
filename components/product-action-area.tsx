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
    <div className="flex flex-col space-y-10">
      <div className="group border-y border-border px-2 py-10 transition-all duration-500 hover:bg-secondary/50">
        <div className="flex items-baseline gap-4">
          <span className="text-4xl font-serif text-foreground">Rs.{dynamicPrice.toLocaleString('en-IN')}</span>
          {hasDiscount && product.compareAtPrice && dynamicPrice === product.price && (
            <span className="text-xl font-light text-foreground/30 line-through">
              Rs.{product.compareAtPrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>
        <p className="mt-2 text-[10px] uppercase leading-none tracking-widest text-foreground/40">
          Complimentary artisan shipping within India
        </p>
      </div>

      {product.shortDescription && (
        <p className="text-lg leading-relaxed text-foreground/70 font-light italic">
          &ldquo;{product.shortDescription}&rdquo;
        </p>
      )}

      <div className="space-y-8 pt-4">
        <ProductSizeSelector
          sizes={sizeOptions}
          selectedVariantId={selectedVariantId}
          onSizeChange={setSelectedVariantId}
        />

        <div className="flex flex-col gap-4">
          <AddToCartButton
            product={product}
            variantId={selectedVariantId || undefined}
            stockOverride={dynamicStock}
          />
          <p className="text-[10px] text-center text-foreground/40 uppercase tracking-[0.2em] font-medium">
            Secure checkout with artisanal handling
          </p>
        </div>
      </div>
    </div>
  )
}
