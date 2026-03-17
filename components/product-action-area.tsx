"use client"

import { useState, useCallback } from "react"
import ProductSizeSelector from "./product-size-selector"
import { AddToCartButton } from "./add-to-cart-button"

export function ProductActionArea({ product, hasDiscount }: { product: any, hasDiscount: boolean }) {
    const [dynamicPrice, setDynamicPrice] = useState(product.price)
    const [dynamicStock, setDynamicStock] = useState(product.stockQuantity)
    const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined)

    // Using useCallback to safely pass to child
    const handleVariantChange = useCallback((variants: Record<string, any>, totalPrice: number, totalStock: number) => {
        setDynamicPrice(totalPrice)
        setDynamicStock(totalStock)

        // Find the specific variant ID if variants are selected
        const variantList = Object.values(variants)
        if (variantList.length > 0) {
            // For simplicity, taking the first selected variant. In a more complex system,
            // this might need logic to find a Master Variant or specific combinations.
            setSelectedVariantId(variantList[0].id)
        } else {
            setSelectedVariantId(undefined)
        }
    }, [])

    return (
        <div className="flex flex-col space-y-10">
            <div className="py-10 border-y border-border group transition-all duration-500 hover:bg-secondary/50 px-2">
                <div className="flex items-baseline gap-4">
                    <span className="text-4xl font-serif text-foreground">
                        ₹{dynamicPrice.toLocaleString("en-IN")}
                    </span>
                    {hasDiscount && product.compareAtPrice && dynamicPrice === product.price && (
                        <span className="text-xl text-foreground/30 line-through font-light">
                            ₹{product.compareAtPrice.toLocaleString("en-IN")}
                        </span>
                    )}
                </div>
                <p className="mt-2 text-[10px] text-foreground/40 uppercase tracking-widest leading-none">
                    Complimentary artisan shipping within India
                </p>
            </div>

            {product.shortDescription && (
                <p className="text-lg leading-relaxed text-foreground/70 font-light italic">
                    &ldquo;{product.shortDescription}&rdquo;
                </p>
            )}

            <div className="space-y-12 pt-4">
                <ProductSizeSelector
                    productId={product.id}
                    productPrice={product.price}
                    productStock={product.stockQuantity}
                    onVariantChange={handleVariantChange}
                />

                <div className="flex flex-col gap-4">
                    <AddToCartButton
                        product={product}
                        variantId={selectedVariantId}
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
