'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { PRODUCT_FALLBACK_IMAGE } from '@/lib/image-fallbacks'
import { useProductVariantContext } from './product-variant-context'

interface GalleryImage {
  id?: string
  imageUrl: string
  altText?: string | null
  sortOrder?: number
  isPrimary?: boolean
}

interface ProductColor {
  id: string
  colorName: string
  colorCode?: string | null
  images: GalleryImage[]
}

interface FlipkartProductGalleryProps {
  colors: ProductColor[]
  legacyImages: GalleryImage[]
  productName: string
}

const colorMap: Record<string, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  purple: '#a855f7',
  pink: '#ec4899',
  orange: '#f97316',
  black: '#000000',
  white: '#ffffff',
  gray: '#6b7280',
  grey: '#6b7280',
  brown: '#a3a3a3',
}

export default function FlipkartProductGallery({ colors, legacyImages, productName }: FlipkartProductGalleryProps) {
  const { productColors, selectedColorId, setSelectedColorId, selectedColor } = useProductVariantContext()
  const [selectedImage, setSelectedImage] = useState(0)

  const activeColors = useMemo(() => {
    const source = colors.length > 0 ? colors : productColors
    return source.map((color) => ({
      ...color,
      images: [...(color.images || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    }))
  }, [colors, productColors])

  const displayImages = useMemo(() => {
    const selected = activeColors.find((color) => color.id === selectedColorId) || activeColors[0]
    const candidateImages = selected?.images?.length ? selected.images : legacyImages
    const images = candidateImages.filter((img) => img && img.imageUrl)
    return images.length > 0 ? images : [{ imageUrl: PRODUCT_FALLBACK_IMAGE, altText: productName }]
  }, [activeColors, legacyImages, productName, selectedColorId])

  const getColorCode = (colorName: string, colorCode?: string | null) => {
    if (colorCode) return colorCode
    const normalized = colorName.toLowerCase().trim()
    return colorMap[normalized] || '#94a3b8'
  }

  if (activeColors.length === 0 && legacyImages.length === 0) {
    return (
      <div className="aspect-square overflow-hidden rounded-lg border bg-muted relative flex items-center justify-center">
        <span className="text-gray-500">Product information unavailable</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 items-start">
      {displayImages.length > 1 && (
        <div className="hidden md:flex flex-col gap-4 w-20 flex-shrink-0">
          {displayImages.map((image, index) => (
            <button
              key={`${image.imageUrl}-${index}`}
              onClick={() => setSelectedImage(index)}
              className={cn(
                'group relative aspect-[4/5] overflow-hidden transition-all duration-500',
                selectedImage === index ? 'border border-primary' : 'border border-transparent hover:border-primary/30'
              )}
            >
              <Image
                src={image.imageUrl}
                alt={image.altText || `${productName} ${index + 1}`}
                width={80}
                height={100}
                className={cn('h-full w-full object-cover transition-transform duration-700', selectedImage === index ? 'scale-105' : 'group-hover:scale-110')}
              />
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 space-y-8 w-full">
        <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
          {displayImages[selectedImage]?.imageUrl ? (
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

        {displayImages.length > 1 && (
          <div className="flex md:hidden gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {displayImages.map((image, index) => (
              <button
                key={`${image.imageUrl}-${index}`}
                onClick={() => setSelectedImage(index)}
                className={cn(
                  'w-20 aspect-[4/5] overflow-hidden flex-shrink-0 transition-all',
                  selectedImage === index ? 'border border-primary' : 'border border-transparent'
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

        {activeColors.length > 0 && (
          <div className="space-y-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Color</span>
              <span className="text-[10px] text-foreground/60 uppercase tracking-widest">
                {selectedColor?.colorName || activeColors[0].colorName}
              </span>
            </div>

            <div className="flex flex-wrap gap-4">
              {activeColors.map((color) => {
                const isSelected = color.id === selectedColorId
                const colorCode = getColorCode(color.colorName, color.colorCode)

                return (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColorId(color.id)}
                    className={cn(
                      'group relative w-10 h-10 rounded-full transition-all duration-500',
                      isSelected ? 'ring-2 ring-primary ring-offset-2' : 'ring-1 ring-border ring-offset-0 hover:ring-primary/40'
                    )}
                  >
                    <div
                      className="absolute inset-1 rounded-full border border-black/5"
                      style={{ backgroundColor: colorCode }}
                    />
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
