'use client'

import { useRouter } from 'next/navigation'
import TiltedCard from './tilted-card'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'

interface CategoryTiltedCardProps {
  category: {
    id: string
    name: string
    slug: string
    description: string
    imageUrl?: string
    products?: any[]
    _count?: {
      productCategories: number
    }
  }
}

export function CategoryTiltedCard({ category }: CategoryTiltedCardProps) {
  const router = useRouter()
  const productCount = category._count?.productCategories || (Array.isArray(category.products) ? category.products.length : 0)

  const handleClick = () => {
    router.push(`/products?category=${category.slug}`)
  }

  return (
    <div className="w-full max-w-sm">
      <TiltedCard
        imageSrc={category.imageUrl || `/placeholder.svg?height=400&width=400&query=${category.name} ceramic`}
        altText={`${category.name} - Premium ceramic collection`}
        captionText={category.name}
        containerHeight="320px"
        containerWidth="280px"
        imageHeight="280px"
        imageWidth="280px"
        rotateAmplitude={8}
        scaleOnHover={1.05}
        showMobileWarning={false}
        showTooltip={true}
        displayOverlayContent={true}
        disableMobileAnimations={true}
        overlayContent={
          <div className="text-white text-center w-full">
            <h3 className="text-xl font-bold mb-2">{category.name}</h3>
            <p className="text-sm opacity-90 mb-3 line-clamp-2">{category.description}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="opacity-80">{productCount} Products</span>
              <div className="flex items-center gap-1 font-medium">
                Shop Now <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        }
        onClick={handleClick}
        className="mx-auto"
      />
    </div>
  )
}