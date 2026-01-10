'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface CategoryCarouselProps {
  categories: Array<{
    id: string
    name: string
    slug: string
    description?: string | null
    imageUrl?: string | null
    _count?: {
      productCategories: number
    }
  }>
}

export function CategoryCarousel({ categories }: CategoryCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === categories.length - 1 ? 0 : prevIndex + 1
      )
    }, 4000) // Change slide every 4 seconds

    return () => clearInterval(interval)
  }, [categories.length])

  // Helper function for gradient colors
  const getGradientColors = (index: number) => {
    const gradients = [
      '#667eea 0%, #764ba2 100%',
      '#f093fb 0%, #f5576c 100%',
      '#4facfe 0%, #00f2fe 100%',
      '#43e97b 0%, #38f9d7 100%'
    ]
    return gradients[index % gradients.length]
  }

  return (
    <div className="category-carousel-container">
      <div className="category-carousel-wrapper">
        <div 
          className="category-carousel-track"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
            transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {categories.map((category, index) => {
            const backgroundStyle: React.CSSProperties = {
              backgroundImage: (category as any).imageUrl 
                ? `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${(category as any).imageUrl})`
                : `linear-gradient(135deg, ${getGradientColors(index)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }

            return (
              <div
                key={category.id}
                className="category-carousel-slide"
                style={backgroundStyle}
              >
                <Link href={`/?category=${category.slug}`} className="category-carousel-content">
                  <div className="category-carousel-text">
                    <h2 className="category-carousel-title">
                      {category.name}
                    </h2>
                    <p className="category-carousel-description">
                      {category.description || `Discover our premium ${category.name.toLowerCase()} collection. Quality craftsmanship meets modern design.`}
                    </p>
                    <div className="category-carousel-cta">
                      {category._count?.productCategories || 0} Products • Click to Explore →
                    </div>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      </div>

      {/* Carousel Indicators */}
      <div className="category-carousel-indicators">
        {categories.map((_, index) => (
          <button
            key={index}
            className={`category-carousel-indicator ${index === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  )
}