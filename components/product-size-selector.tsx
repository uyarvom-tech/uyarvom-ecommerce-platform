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
  onVariantChange?: (selectedVariants: Record<string, ProductVariant>, totalPrice: number, totalStock: number) => void
}

export default function ProductSizeSelector({ 
  productId, 
  productPrice, 
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
      return 0 // No variants selected
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
    <div className="space-y-4">
      {nonColorVariants.map(([variantName, variantList]) => (
        <div key={variantName} className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="font-semibold text-base text-gray-800">
              {variantName}:
            </label>
            {selectedVariants[variantName] && (
              <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                {selectedVariants[variantName].value}
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {variantList.map((variant) => {
              const isSelected = selectedVariants[variantName]?.id === variant.id
              const isOutOfStock = variant.stock === 0
              
              return (
                <Button
                  key={variant.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  disabled={isOutOfStock}
                  onClick={() => handleVariantSelect(variantName, variant)}
                  className={cn(
                    "relative min-w-[70px] h-10 font-medium",
                    isSelected && "bg-primary text-primary-foreground border-primary",
                    isOutOfStock && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {variant.value}
                  {variant.price && variant.price !== productPrice && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      +₹{variant.price - productPrice}
                    </Badge>
                  )}
                  {isOutOfStock && (
                    <span className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 text-xs text-gray-500 rounded">
                      Out of Stock
                    </span>
                  )}
                </Button>
              )
            })}
          </div>

          {/* Show selected variant details */}
          {selectedVariants[variantName] && (
            <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
              <span className="font-medium">{selectedVariants[variantName].value}</span>
              {selectedVariants[variantName].price && (
                <span className="ml-2">
                  - ₹{selectedVariants[variantName].price}
                </span>
              )}
              <span className="ml-2">
                ({selectedVariants[variantName].stock} available)
              </span>
            </div>
          )}
        </div>
      ))}

      {/* Price Summary */}
      {Object.keys(selectedVariants).length > 0 && (
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-800">Selected Price:</span>
            <div className="text-right">
              <span className="font-bold text-lg text-green-600">₹{calculateTotalPrice()}</span>
              {calculateTotalPrice() !== productPrice && (
                <div className="text-sm text-gray-500 line-through">₹{productPrice}</div>
              )}
            </div>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Stock available: {calculateTotalStock()}
          </div>
        </div>
      )}
    </div>
  )
}
