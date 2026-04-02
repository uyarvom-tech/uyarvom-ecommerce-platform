'use client'

import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export interface ProductVariantOption {
  id: string
  size: string
  price: number | null
  stock: number
  isActive: boolean
  sku?: string | null
  sortOrder?: number
}

export interface ProductColorOption {
  id: string
  colorName: string
  colorCode?: string | null
  images: Array<{
    id?: string
    imageUrl: string
    altText?: string | null
    sortOrder?: number
    isPrimary?: boolean
  }>
  variants: ProductVariantOption[]
}

interface ProductVariantContextValue {
  productColors: ProductColorOption[]
  selectedColorId: string | null
  selectedVariantId: string | null
  setSelectedColorId: (colorId: string) => void
  setSelectedVariantId: (variantId: string | null) => void
  selectedColor: ProductColorOption | null
  selectedVariant: ProductVariantOption | null
}

const ProductVariantContext = createContext<ProductVariantContextValue | null>(null)

export function ProductVariantProvider({
  productColors,
  children,
}: {
  productColors: ProductColorOption[]
  children: ReactNode
}) {
  const normalizedColors = useMemo(() => {
    return (productColors || []).map((color) => ({
      ...color,
      variants: [...(color.variants || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
      images: [...(color.images || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    }))
  }, [productColors])

  const [selectedColorId, setSelectedColorIdState] = useState<string | null>(
    normalizedColors[0]?.id || null
  )
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)

  useEffect(() => {
    if (!normalizedColors.length) {
      setSelectedColorIdState(null)
      setSelectedVariantId(null)
      return
    }

    const currentColor = normalizedColors.find((color) => color.id === selectedColorId) || normalizedColors[0]
    if (!currentColor) {
      setSelectedColorIdState(null)
      setSelectedVariantId(null)
      return
    }

    if (!selectedColorId || currentColor.id !== selectedColorId) {
      setSelectedColorIdState(currentColor.id)
    }

    const availableVariant = currentColor.variants.find((variant) => variant.isActive && variant.stock > 0) || currentColor.variants[0] || null
    setSelectedVariantId(availableVariant?.id || null)
  }, [normalizedColors, selectedColorId])

  const selectedColor = normalizedColors.find((color) => color.id === selectedColorId) || null
  const selectedVariant = selectedColor?.variants.find((variant) => variant.id === selectedVariantId) || null

  const setSelectedColorId = (colorId: string) => {
    setSelectedColorIdState(colorId)
    const color = normalizedColors.find((item) => item.id === colorId)
    const firstVariant = color?.variants.find((variant) => variant.isActive && variant.stock > 0) || color?.variants[0] || null
    setSelectedVariantId(firstVariant?.id || null)
  }

  return (
    <ProductVariantContext.Provider
      value={{
        productColors: normalizedColors,
        selectedColorId,
        selectedVariantId,
        setSelectedColorId,
        setSelectedVariantId,
        selectedColor,
        selectedVariant,
      }}
    >
      {children}
    </ProductVariantContext.Provider>
  )
}

export function useProductVariantContext() {
  const context = useContext(ProductVariantContext)
  if (!context) {
    throw new Error('useProductVariantContext must be used within ProductVariantProvider')
  }
  return context
}
