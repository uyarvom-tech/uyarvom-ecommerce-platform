'use client'

import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"
import { useState, useEffect } from "react"

export function ProductCard({ product }: { product: any }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  
  // Filter to get only main product images (not color variant images)
  // Main product images are in product.images, color variant images are in product.variants[].images
  const mainImages = (product.images || []).filter((img: any) => 
    img && (img.imageUrl || img.image_url) && (img.imageUrl || img.image_url).trim() !== ''
  )
  
  const hasMultipleImages = mainImages.length > 1
  
  // Create a safe placeholder URL
  const placeholderUrl = `/placeholder.svg?height=400&width=400&query=${encodeURIComponent(product.name || 'product')}`
  
  // Use main images if available, otherwise use placeholder
  const displayImages = mainImages.length > 0 ? mainImages : [{ imageUrl: placeholderUrl, altText: product.name }]
  
  // Auto-cycle through images on hover (only if we have actual multiple images)
  useEffect(() => {
    if (!isHovering || !hasMultipleImages || mainImages.length <= 1) return
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % mainImages.length)
    }, 2000) // Change image every 2 seconds for better viewing
    
    return () => clearInterval(interval)
  }, [isHovering, hasMultipleImages, mainImages.length])
  
  // Reset to first image when not hovering
  useEffect(() => {
    if (!isHovering) {
      setCurrentImageIndex(0)
    }
  }, [isHovering])
  
  const currentImage = displayImages[currentImageIndex] || displayImages[0]
  
  // Fix discount calculation logic
  const comparePrice = product.compareAtPrice || product.compare_at_price
  const currentPrice = product.price
  
  const hasDiscount = comparePrice && comparePrice > currentPrice
  const discountPercent = hasDiscount
    ? Math.round(((comparePrice - currentPrice) / comparePrice) * 100)
    : 0
    
  const isLowStock = (product.stockQuantity || product.stock_quantity) <= (product.lowStockThreshold || product.low_stock_threshold || 10) && (product.stockQuantity || product.stock_quantity) > 0
  const isNew = new Date(product.createdAt || product.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div 
        className="apple-card p-0 apple-hover-lift"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Compact Product Card - Image with overlaid info */}
        <div className="relative aspect-square overflow-hidden bg-secondary/20 rounded-[20px]">
          {/* Single Image Display with Smooth Transitions */}
          <div className="relative w-full h-full">
            {displayImages.map((image: string, index: number) => (
              <div
                key={index}
                className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                  index === currentImageIndex 
                    ? 'opacity-100 translate-x-0' 
                    : index < currentImageIndex 
                      ? 'opacity-0 -translate-x-full' 
                      : 'opacity-0 translate-x-full'
                }`}
              >
                <Image
                  src={image?.imageUrl || image?.image_url || placeholderUrl}
                  alt={image?.altText || image?.alt_text || product.name}
                  width={400}
                  height={400}
                  className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            ))}
          </div>

          {/* Image Indicators - Show dots if multiple main images */}
          {hasMultipleImages && mainImages.length > 1 && (
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex gap-1">
              {mainImages.map((_: string, index: number) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    index === currentImageIndex 
                      ? 'bg-white shadow-lg' 
                      : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Top Badges */}
          <div className="absolute right-2 top-2 flex flex-col gap-1">
            {hasDiscount && (
              <Badge className="bg-destructive text-destructive-foreground border-0 px-1.5 py-0.5 text-[10px] font-semibold rounded-full apple-shadow">
                {discountPercent}%
              </Badge>
            )}
            {isNew && (
              <Badge className="bg-primary text-primary-foreground border-0 px-1.5 py-0.5 text-[10px] font-semibold rounded-full apple-shadow">
                NEW
              </Badge>
            )}
          </div>

          {/* Stock Badge */}
          {isLowStock && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-amber-500/90 text-white border-0 px-1.5 py-0.5 text-[10px] font-semibold rounded-full apple-shadow backdrop-blur-sm">
                {product.stockQuantity || product.stock_quantity} left
              </Badge>
            </div>
          )}

          {/* Out of Stock Overlay */}
          {(product.stockQuantity || product.stock_quantity) <= 0 && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-[20px]">
              <Badge className="bg-white/90 text-black border-0 px-3 py-1 text-xs font-semibold rounded-full">
                Out of Stock
              </Badge>
            </div>
          )}

          {/* Bottom Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 rounded-b-[20px]">
            {/* Product Name */}
            <h3 className="text-white text-sm font-semibold leading-tight line-clamp-1 mb-1">
              {product.name}
            </h3>
            
            {/* Price and Rating Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-white text-base font-bold tracking-tight">
                  ₹{product.price.toLocaleString("en-IN")}
                </span>
                {hasDiscount && (
                  <span className="text-white/70 text-xs line-through">
                    ₹{(product.compareAtPrice || product.compare_at_price).toLocaleString("en-IN")}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="text-white font-semibold text-xs">4.8</span>
              </div>
            </div>

            {/* Category and Image Count */}
            <div className="flex items-center justify-between mt-1">
              <p className="text-white/80 text-[10px] font-medium uppercase tracking-wider">
                {product.productCategories?.[0]?.category?.name || 'Uncategorized'}
              </p>
              {hasMultipleImages && mainImages.length > 1 && (
                <p className="text-white/60 text-[10px] font-medium">
                  {mainImages.length} photos
                </p>
              )}
            </div>
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-primary/10 opacity-0 transition-all duration-300 group-hover:opacity-100 rounded-[20px]" />
        </div>
      </div>
    </Link>
  )
}
