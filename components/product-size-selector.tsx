'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ProductVariant {
  id: string
  name: string
  value: string
  price: number | null
  stock: number
  isActive: boolean
}

interface ProductSizeSelectorProps {
  productId: string
  productPrice: number
  productStock: number
  onVariantChange?: (selectedVariants: Record<string, ProductVariant>, totalPrice: number, totalStock: number) => void
}

export default function ProductSizeSelector({
  productId,
  productPrice,
  productStock,
  onVariantChange
}: ProductSizeSelectorProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [selectedVariants, setSelectedVariants] = useState<Record<string, ProductVariant>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVariants()
  }, [productId])

  useEffect(() => {
    // Calculate total price and stock based on selected variants
    const totalPrice = calculateTotalPrice()
    const totalStock = calculateTotalStock()

    if (onVariantChange) {
      onVariantChange(selectedVariants, totalPrice, totalStock)
    }
  }, [selectedVariants, onVariantChange])

  const fetchVariants = async () => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/variants`)
      if (response.ok) {
        const data = await response.json()
        const activeVariants = data.filter((v: ProductVariant) => v.isActive && v.stock > 0)
        setVariants(activeVariants)
      }
    } catch (error) {
      console.error('Error fetching variants:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotalPrice = () => {
    let totalPrice = productPrice

    Object.values(selectedVariants).forEach(variant => {
      if (variant.price !== null) {
        totalPrice = variant.price // Use variant price override
      }
    })

    return totalPrice
  }

  const calculateTotalStock = () => {
    if (Object.keys(selectedVariants).length === 0) {
      return productStock // Use explicit parent product stock when no variants are selected
    }

    // Find the minimum stock among selected variants
    const stocks = Object.values(selectedVariants).map(v => v.stock)
    return Math.min(...stocks)
  }

  const handleVariantSelect = (variantName: string, variant: ProductVariant) => {
    setSelectedVariants(prev => ({
      ...prev,
      [variantName]: variant
    }))
  }

  const groupedVariants = variants.reduce((acc, variant) => {
    if (!acc[variant.name]) {
      acc[variant.name] = []
    }
    acc[variant.name].push(variant)
    return acc
  }, {} as Record<string, ProductVariant[]>)

  // Only show non-color variants (Size, Material, etc.)
  const nonColorVariants = Object.entries(groupedVariants).filter(
    ([name]) => name.toLowerCase() !== 'color'
  )

  if (loading || nonColorVariants.length === 0) {
    return null // No size/other variants available
  }

  return (
    <div className="space-y-10">
      {nonColorVariants.map(([variantName, variantList]) => (
        <div key={variantName} className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
              {variantName} Selection
            </span>
            {selectedVariants[variantName] && (
              <span className="text-[10px] text-foreground/40 uppercase tracking-widest font-medium">
                {selectedVariants[variantName].value}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            {variantList.map((variant) => {
              const isSelected = selectedVariants[variantName]?.id === variant.id
              const isOutOfStock = variant.stock === 0

              return (
                <button
                  key={variant.id}
                  disabled={isOutOfStock}
                  onClick={() => handleVariantSelect(variantName, variant)}
                  className={cn(
                    "group relative h-14 min-w-[100px] border px-6 transition-all duration-500 rounded-sm overflow-hidden",
                    isSelected
                      ? "bg-foreground text-white border-foreground"
                      : "bg-transparent text-foreground border-border hover:border-primary/50",
                    isOutOfStock && "opacity-20 cursor-not-allowed"
                  )}
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] relative z-10">{variant.value}</span>
                  {variant.price && variant.price !== productPrice && (
                    <span className={cn(
                      "ml-3 text-[9px] relative z-10",
                      isSelected ? "text-primary/80" : "text-foreground/40"
                    )}>
                      (+₹{variant.price - productPrice})
                    </span>
                  )}
                  {isOutOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-[1px] h-full bg-foreground/20 rotate-12" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
