'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { PRODUCT_FALLBACK_IMAGE } from '@/lib/image-fallbacks'

interface ProductImage {
  id?: string
  imageUrl: string
  altText: string | null
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
      : [{ imageUrl: PRODUCT_FALLBACK_IMAGE, altText: productName }]

    setDisplayImages(initialImages)
    setSelectedImage(0)
  }, [images, productName])

  // Update display images when color variant is selected
  useEffect(() => {
    const selectedColorVariant = selectedVariants['Color'] || selectedVariants['color']

    if (selectedColorVariant) {
      // Use the variant's images if available, otherwise fallback to colorImage
      let imagesToShow: any[] = []

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
      : [{ imageUrl: PRODUCT_FALLBACK_IMAGE, altText: productName }]

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
    <div className="flex flex-col md:flex-row gap-8 items-start">
      {/* Vertical Thumbnails - Left Side */}
      {displayImages.length > 1 && (
        <div className="hidden md:flex flex-col gap-4 w-20 flex-shrink-0">
          {displayImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={cn(
                "group relative aspect-[4/5] overflow-hidden transition-all duration-500",
                selectedImage === index
                  ? "border border-primary"
                  : "border border-transparent hover:border-primary/30"
              )}
            >
              <Image
                src={image.imageUrl}
                alt={image.altText || `${productName} ${index + 1}`}
                width={80}
                height={100}
                className={cn(
                  "h-full w-full object-cover transition-transform duration-700",
                  selectedImage === index ? "scale-105" : "group-hover:scale-110"
                )}
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Showcase Area */}
      <div className="flex-1 space-y-8">
        <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
          {displayImages[selectedImage] && displayImages[selectedImage].imageUrl ? (
            <Image
              src={displayImages[selectedImage].imageUrl}
              alt={displayImages[selectedImage].altText || productName}
              fill
              className="object-cover animate-luxury"
              priority
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <span className="text-[10px] uppercase tracking-widest text-foreground/40 font-bold">Provenance Unavailable</span>
            </div>
          )}
        </div>

        {/* Mobile Thumbnails */}
        {displayImages.length > 1 && (
          <div className="flex md:hidden gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {displayImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={cn(
                  "w-20 aspect-[4/5] overflow-hidden flex-shrink-0 transition-all",
                  selectedImage === index ? "border border-primary" : "border border-transparent"
                )}
              >
                <Image
                  src={image.imageUrl}
                  alt={image.altText || productName}
                  width={80}
                  height={100}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Color Palette Refined */}
        {colorVariants.length > 0 && (
          <div className="space-y-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Artisan Glaze</span>
              {(selectedVariants['Color'] || selectedVariants['color']) && (
                <span className="text-[10px] text-foreground/60 uppercase tracking-widest">
                  {(selectedVariants['Color'] || selectedVariants['color']).value}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-4">
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
                      "group relative w-10 h-10 rounded-full transition-all duration-500",
                      isSelected ? "ring-2 ring-primary ring-offset-2" : "ring-1 ring-border ring-offset-0 hover:ring-primary/40",
                      isOutOfStock && "opacity-20 cursor-not-allowed"
                    )}
                  >
                    <div
                      className="absolute inset-1 rounded-full border border-black/5"
                      style={{ backgroundColor: colorCode }}
                    />
                    {isOutOfStock && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-[1px] h-full bg-foreground/20 rotate-45" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
