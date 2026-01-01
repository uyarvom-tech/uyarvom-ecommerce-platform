'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ProductImage {
  id?: string
  imageUrl: string
  altText: string
  isPrimary?: boolean
  sortOrder?: number
}

interface ProductVariant {
  id: string
  name: string
  value: string
  price: number | null
  stock: number
  isActive: boolean
  colorCode?: string | null
  colorImage?: string | null
  images?: Array<{
    id: string
    imageUrl: string
    altText: string
    sortOrder: number
  }>
}

interface FlipkartProductGalleryProps {
  images: ProductImage[]
  productName: string
  productId: string
  productSlug?: string // Add optional slug prop
  productPrice: number
  onVariantChange?: (selectedVariants: Record<string, ProductVariant>, totalPrice: number, totalStock: number) => void
}

// Color mapping for common color names to hex codes
const colorMap: Record<string, string> = {
  'red': '#ef4444',
  'blue': '#3b82f6',
  'green': '#22c55e',
  'yellow': '#eab308',
  'purple': '#a855f7',
  'pink': '#ec4899',
  'orange': '#f97316',
  'black': '#000000',
  'white': '#ffffff',
  'gray': '#6b7280',
  'grey': '#6b7280',
  'brown': '#a3a3a3',
  'clear': '#f8fafc',
  'transparent': '#f1f5f9',
  'tinted': '#64748b'
}

export default function FlipkartProductGallery({
  images,
  productName,
  productId,
  productSlug,
  productPrice,
  onVariantChange
}: FlipkartProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [selectedVariants, setSelectedVariants] = useState<Record<string, ProductVariant>>({})
  const [loading, setLoading] = useState(true)
  const [displayImages, setDisplayImages] = useState<ProductImage[]>([])
  const [mounted, setMounted] = useState(false)

  // Validate props
  if (!productName || !productId) {
    console.error('FlipkartProductGallery: Missing required props', { productName, productId })
    return (
      <div className="flex-1 min-w-0 space-y-4">
        <div className="aspect-square overflow-hidden rounded-lg border bg-muted relative flex items-center justify-center">
          <span className="text-gray-500">Product information unavailable</span>
        </div>
      </div>
    )
  }

  // Initialize component
  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize display images
  useEffect(() => {
    const validImages = Array.isArray(images) 
      ? images.filter(img => img && typeof img === 'object' && img.imageUrl)
      : []
    
    const initialImages = validImages.length > 0
      ? validImages
      : [{ imageUrl: `/placeholder.svg?height=600&width=600&query=${encodeURIComponent(productName)}`, altText: productName }]
    
    setDisplayImages(initialImages)
    setSelectedImage(0)
  }, [images, productName])

  // Update display images when color variant is selected
  useEffect(() => {
    const selectedColorVariant = selectedVariants['Color'] || selectedVariants['color']
    
    if (selectedColorVariant) {
      // Use the variant's images if available, otherwise fallback to colorImage
      let imagesToShow = []
      
      if (selectedColorVariant.images && selectedColorVariant.images.length > 0) {
        // Use the variant's multiple images
        imagesToShow = selectedColorVariant.images.map(img => ({
          imageUrl: img.imageUrl,
          altText: img.altText || `${productName} - ${selectedColorVariant.value}`,
          isPrimary: img.sortOrder === 0
        }))
      } else if (selectedColorVariant.colorImage) {
        // Fallback to single colorImage
        imagesToShow = [{
          imageUrl: selectedColorVariant.colorImage,
          altText: `${productName} - ${selectedColorVariant.value}`,
          isPrimary: true
        }]
      }
      
      if (imagesToShow.length > 0) {
        setDisplayImages(imagesToShow)
        
        // Maintain the same image position when switching colors
        // If current selectedImage is beyond the new color's image count, go to last available image
        const newImageIndex = Math.min(selectedImage, imagesToShow.length - 1)
        setSelectedImage(newImageIndex)
        return
      }
    }
    
    // No color selected or no color images, show the first product image only
    const validImages = Array.isArray(images) 
      ? images.filter(img => img && typeof img === 'object' && img.imageUrl)
      : []
      
    const firstImage = validImages.length > 0
      ? [validImages[0]] // Only show the first image
      : [{ imageUrl: `/placeholder.svg?height=600&width=600&query=${encodeURIComponent(productName)}`, altText: productName }]
    
    setDisplayImages(firstImage)
    setSelectedImage(0)
  }, [selectedVariants, images, productName, selectedImage])

  useEffect(() => {
    // Calculate total price and stock based on selected variants
    const totalPrice = calculateTotalPrice()
    const totalStock = calculateTotalStock()
    
    if (onVariantChange) {
      onVariantChange(selectedVariants, totalPrice, totalStock)
    }
  }, [selectedVariants, productPrice])

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

  // Fetch variants from API
  useEffect(() => {
    if (!productId) {
      setLoading(false)
      return
    }

    const fetchVariants = async () => {
      try {
        const apiUrl = productSlug 
          ? `/api/products/${productSlug}/variants`
          : `/api/admin/products/${productId}/variants`
          
        const response = await fetch(apiUrl)
        
        if (response.ok) {
          const data = await response.json()
          
          if (Array.isArray(data)) {
            // Filter for active variants with stock
            const activeVariants = data.filter((v: ProductVariant) => 
              v && v.isActive && v.stock > 0
            )
            setVariants(activeVariants)
          }
        }
      } catch (error) {
        console.error('Error fetching variants:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVariants()
  }, [productId, productSlug])

  // Use real variants from API
  const groupedVariants = variants.reduce((acc, variant) => {
    if (!acc[variant.name]) {
      acc[variant.name] = []
    }
    acc[variant.name].push(variant)
    return acc
  }, {} as Record<string, ProductVariant[]>)

  // Only show color variants here
  const colorVariants = groupedVariants['Color'] || groupedVariants['color'] || []

  const getColorCode = (colorName: string, variant: ProductVariant): string => {
    // First try to use the colorCode from the variant if available
    if (variant.colorCode) {
      return variant.colorCode
    }
    
    // Fallback to color name mapping
    const normalizedName = colorName.toLowerCase().trim()
    return colorMap[normalizedName] || '#94a3b8' // Default gray if color not found
  }

  return (
    <div className="flex gap-6 items-start">
      {/* Main Image Area - Fixed width */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Main Product Image - Fixed aspect ratio */}
        <div className="aspect-square overflow-hidden rounded-lg border bg-muted relative">
          {displayImages[selectedImage] && displayImages[selectedImage].imageUrl ? (
            <Image
              src={displayImages[selectedImage].imageUrl}
              alt={displayImages[selectedImage].altText || productName}
              width={600}
              height={600}
              className="h-full w-full object-cover"
              priority
              onError={(e) => {
                console.error('Image failed to load:', displayImages[selectedImage].imageUrl)
                // Fallback to placeholder
                e.currentTarget.src = `/placeholder.svg?height=600&width=600&query=${encodeURIComponent(productName)}`
              }}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gray-100">
              <span className="text-gray-500">No image available</span>
            </div>
          )}
          
          {/* Price overlay if variant selected */}
          {Object.keys(selectedVariants).length > 0 && (
            <div className="absolute top-4 left-4 bg-black/80 text-white px-3 py-1 rounded-lg">
              <span className="font-bold text-lg">₹{calculateTotalPrice()}</span>
              {calculateTotalPrice() !== productPrice && (
                <span className="text-sm line-through ml-2 opacity-75">₹{productPrice}</span>
              )}
            </div>
          )}
        </div>

        {/* Image Thumbnails - Show when selected color has multiple images */}
        {displayImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {displayImages.map((image, index) => {
              // Skip invalid images
              if (!image || !image.imageUrl) return null
              
              return (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={cn(
                    "image-thumbnail w-16 h-16 overflow-hidden rounded-md border-2 transition-all flex-shrink-0",
                    selectedImage === index 
                      ? "selected border-primary" 
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <Image
                    src={image.imageUrl}
                    alt={image.altText || `${productName} ${index + 1}`}
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      console.error('Thumbnail failed to load:', image.imageUrl)
                      e.currentTarget.src = `/placeholder.svg?height=64&width=64&query=${encodeURIComponent(productName)}`
                    }}
                  />
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Color Palette - Only Colors */}
      {colorVariants.length > 0 && (
        <div className="color-selector-container flex flex-col gap-3 pt-4">
          <label className="font-medium text-sm text-gray-700">Colors:</label>
          
          <div className="flex flex-col gap-3">
            {colorVariants.map((variant) => {
              const isSelected = selectedVariants['Color']?.id === variant.id || selectedVariants['color']?.id === variant.id
              const isOutOfStock = variant.stock === 0
              const colorCode = getColorCode(variant.value, variant)
              
              return (
                <button
                  key={variant.id}
                  disabled={isOutOfStock}
                  onClick={() => handleVariantSelect(variant.name, variant)}
                  className={cn(
                    "color-dot relative rounded-full border-2 transition-all",
                    isSelected && "selected",
                    isOutOfStock && "out-of-stock",
                    !isSelected && !isOutOfStock && "border-gray-300 hover:border-gray-400"
                  )}
                  style={{ backgroundColor: colorCode }}
                  title={`${variant.value}${variant.price ? ` - ₹${variant.price}` : ''}`}
                >
                  {/* White border for light colors */}
                  {(colorCode === '#ffffff' || colorCode === '#f8fafc' || colorCode === '#f1f5f9') && (
                    <div className="absolute inset-1 rounded-full border border-gray-300" />
                  )}
                  
                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute inset-0 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full shadow-sm" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          
          {/* Selected color name */}
          {(selectedVariants['Color'] || selectedVariants['color']) && (
            <div className="text-xs text-gray-600 text-center max-w-[48px] break-words">
              {(selectedVariants['Color'] || selectedVariants['color']).value}
            </div>
          )}
        </div>
      )}
    </div>
  )
}