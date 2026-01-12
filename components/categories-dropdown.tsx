'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Category } from "@/types"

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

      {/* Apple-style Categories Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 pt-2 z-50">
          <div className="w-96 bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-2xl animate-in slide-in-from-top-1 fade-in-0 duration-200">
            <div className="px-6 py-6">
              <div>
                <ul className="space-y-2">
                  <li>
                    <Link href="/products" className="block text-lg font-semibold text-gray-900 hover:text-amber-800 transition-colors duration-200 py-2 border-b border-gray-100">
                      Explore All Categories
                    </Link>
                  </li>
                  {categories.map((category) => (
                    <li key={category.id}>
                      <Link 
                        href={`/products?category=${category.slug}`} 
                        className="flex items-center gap-3 text-sm text-gray-700 hover:text-amber-800 hover:bg-amber-50/50 transition-all duration-200 py-2 px-2 rounded-lg"
                      >
                        {category.imageUrl && (
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <Image
                              src={category.imageUrl}
                              alt={category.name}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{category.name}</div>
                          {category.description && (
                            <div className="text-xs text-gray-500 line-clamp-1">
                              {category.description}
                            </div>
                          )}
                        </div>
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