'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface ProductVariant {
  id: string
  name: string
  value: string
  price: number | null
  stock: number
  isActive: boolean
}

interface VariantSelectorProps {
  productId: string
  productPrice: number
  onVariantChange?: (selectedVariants: Record<string, ProductVariant>, totalPrice: number, totalStock: number) => void
}

export default function ProductVariantSelector({ 
  productId, 
  productPrice, 
  onVariantChange 
}: VariantSelectorProps) {
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
      return 0 // No variants selected, use product stock
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

  if (loading) {
    return <div className="animate-pulse">Loading variants...</div>
  }

  if (Object.keys(groupedVariants).length === 0) {
    return null // No variants available
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Select Options</h3>
      
      {Object.entries(groupedVariants).map(([variantName, variantList]) => (
        <div key={variantName} className="space-y-2">
          <label className="font-medium text-sm text-gray-700">
            {variantName}
            {selectedVariants[variantName] && (
              <span className="ml-2 text-gray-500">
                - {selectedVariants[variantName].value}
              </span>
            )}
          </label>
          
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
                  className={`relative ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {variant.value}
                  {variant.price && variant.price !== productPrice && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      ₹{variant.price}
                    </Badge>
                  )}
                  {isOutOfStock && (
                    <span className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 text-xs text-gray-500">
                      Out of Stock
                    </span>
                  )}
                </Button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Price and Stock Summary */}
      {Object.keys(selectedVariants).length > 0 && (
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-lg">₹{calculateTotalPrice()}</p>
                {calculateTotalPrice() !== productPrice && (
                  <p className="text-sm text-gray-500 line-through">₹{productPrice}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  {calculateTotalStock()} in stock
                </p>
                {Object.keys(selectedVariants).length < Object.keys(groupedVariants).length && (
                  <p className="text-xs text-amber-600">
                    Select all options to see availability
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selection Status */}
      {Object.keys(selectedVariants).length < Object.keys(groupedVariants).length && (
        <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
          Please select all options to add to cart
        </div>
      )}
    </div>
  )
}