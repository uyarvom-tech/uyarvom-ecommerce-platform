'use client'

import { useEffect, useMemo, useState } from 'react'
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

  useEffect(() => {
    setSelectedImage(0)
  }, [selectedColorId, displayImages.length])

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
    <div className="flex flex-col items-start gap-8">
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

      <div className="w-full flex-1 space-y-8">
        <div className="md:hidden mb-5 overflow-hidden rounded-[28px] border border-border/40 bg-gradient-to-b from-[#faf7f1] to-white shadow-[0_18px_50px_rgba(0,0,0,0.06)]">
          <div className="relative aspect-square p-3">
            <div className="absolute left-4 top-4 z-10 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-foreground shadow-sm">
              {selectedImage + 1}/{displayImages.length}
            </div>

            <div className="relative h-full w-full overflow-hidden rounded-[22px] bg-white">
              {displayImages[selectedImage]?.imageUrl ? (
                <Image
                  src={displayImages[selectedImage].imageUrl}
                  alt={displayImages[selectedImage].altText || productName}
                  fill
                  className="object-contain object-center"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Provenance Unavailable</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="relative hidden aspect-[4/5] overflow-hidden bg-secondary md:block">
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

        {activeColors.length > 0 && (
          <div className="space-y-5 border-t border-border pt-5 md:space-y-6 md:pt-6">
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
