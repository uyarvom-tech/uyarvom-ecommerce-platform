'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  slug: string
  description: string
  image_url: string
}

interface CategoriesDropdownProps {
  categories: Category[]
}

export function CategoriesDropdown({ categories }: CategoriesDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Categories Link */}
      <Link href="/categories" className="premium-nav-link flex items-center gap-1">
        Categories
      </Link>

      {/* Simple Categories Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 pt-2 z-50">
          <div className="w-80 bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-2xl animate-in slide-in-from-top-1 fade-in-0 duration-200">
            <div className="px-6 py-6">
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">
                </h3>
                <ul className="space-y-1">
                  <li>
                    <Link href="/categories" className="block text-lg font-semibold text-gray-900 hover:text-amber-800 transition-colors duration-200 py-1">
                      Explore All Categories
                    </Link>
                  </li>
                  {categories.map((category) => (
                    <li key={category.id}>
                      <Link 
                        href={`/products?category=${category.slug}`} 
                        className="block text-sm text-gray-700 hover:text-amber-800 transition-colors duration-200 py-1"
                      >
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}