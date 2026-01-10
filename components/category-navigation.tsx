'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown, X } from 'lucide-react'
import { navigationCategories, type NavigationCategory } from '@/lib/category-navigation-data'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function CategoryNavigation() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigationRef = useRef<HTMLDivElement>(null)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle scroll to show/hide icons
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      setIsScrolled(scrollTop > 100) // Hide icons after scrolling 100px
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        navigationRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !navigationRef.current.contains(event.target as Node)
      ) {
        setActiveCategory(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveCategory(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleCategoryClick = (categoryId: string) => {
    if (activeCategory === categoryId) {
      setActiveCategory(null)
    } else {
      setActiveCategory(categoryId)
    }
  }

  const handleCategoryHover = (categoryId: string) => {
    if (!isMobile) {
      setActiveCategory(categoryId)
    }
  }

  const handleMouseLeave = () => {
    if (!isMobile) {
      setActiveCategory(null)
    }
  }

  const activeCategoryData = navigationCategories.find(cat => cat.id === activeCategory)

  return (
    <div className={cn(
      "w-full bg-background border-b border-border/50 relative transition-all duration-300",
      isScrolled ? "sticky top-16 z-40 shadow-sm bg-white/95 backdrop-blur-sm" : ""
    )}>
      {/* Category Icons Row */}
      <div 
        ref={navigationRef}
        className={cn(
          "max-w-[1200px] mx-auto px-4 transition-all duration-300",
          isScrolled ? "py-3" : "py-6"
        )}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-center justify-center gap-6 md:gap-8 overflow-x-auto scrollbar-hide">
          {navigationCategories.map((category) => (
            <CategoryIcon
              key={category.id}
              category={category}
              isActive={activeCategory === category.id}
              onClick={() => handleCategoryClick(category.id)}
              onHover={() => handleCategoryHover(category.id)}
              isMobile={isMobile}
              isScrolled={isScrolled}
            />
          ))}
        </div>
      </div>

      {/* Mega Dropdown */}
      {activeCategory && activeCategoryData && (
        <div
          ref={dropdownRef}
          className={cn(
            "absolute left-0 right-0 top-full w-full bg-white border-t border-border/20 shadow-xl transition-all duration-300 ease-out animate-slide-down z-50 rounded-b-2xl",
            isMobile ? "fixed inset-x-0 bottom-0 top-auto animate-slide-up-from-bottom z-50 rounded-t-2xl rounded-b-none" : ""
          )}
        >
          {isMobile ? (
            <MobileDropdown
              category={activeCategoryData}
              onClose={() => setActiveCategory(null)}
            />
          ) : (
            <DesktopDropdown category={activeCategoryData} />
          )}
        </div>
      )}

      {/* Mobile Overlay */}
      {isMobile && activeCategory && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setActiveCategory(null)}
        />
      )}
    </div>
  )
}

interface CategoryIconProps {
  category: NavigationCategory
  isActive: boolean
  onClick: () => void
  onHover: () => void
  isMobile: boolean
  isScrolled: boolean
}

function CategoryIcon({ category, isActive, onClick, onHover, isMobile, isScrolled }: CategoryIconProps) {
  // Use real image URL from category data
  const imageUrl = category.icon || `/category-icons/${category.slug}.png`
  
  if (isScrolled) {
    // Scrolled state - text only
    return (
      <button
        onClick={onClick}
        onMouseEnter={onHover}
        className={cn(
          "text-sm font-medium px-3 py-2 transition-all duration-200 whitespace-nowrap",
          isActive
            ? "bg-amber-100 text-amber-800 font-semibold"
            : "text-gray-700 hover:text-amber-600 hover:bg-amber-50"
        )}
      >
        {category.name}
      </button>
    )
  }

  // Non-scrolled state - image + text
  return (
    <div
      className="flex flex-col items-center cursor-pointer group"
      onClick={onClick}
      onMouseEnter={onHover}
    >
      {/* Image Container */}
      <div
        className={cn(
          "relative w-16 h-16 md:w-20 md:h-20 rounded-full border-2 transition-all duration-200 mb-3 category-icon-hover overflow-hidden",
          "bg-gradient-to-br from-amber-50 to-amber-100",
          "group-hover:shadow-md group-hover:scale-105",
          isActive 
            ? "border-amber-400 shadow-lg scale-105" 
            : "border-amber-200 group-hover:border-amber-300"
        )}
      >
        {/* Category Image */}
        <Image
          src={imageUrl}
          alt={category.name}
          width={80}
          height={80}
          className="w-full h-full object-cover rounded-full"
          onError={(e) => {
            // Fallback to placeholder image if category image fails to load
            const target = e.target as HTMLImageElement
            target.src = '/placeholder.svg'
          }}
        />
        
        {/* Active Indicator */}
        {isActive && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-amber-400 rounded-full animate-pulse border-2 border-white" />
        )}
      </div>

      {/* Category Label */}
      <span
        className={cn(
          "text-sm font-medium text-center transition-colors duration-200 leading-tight whitespace-nowrap",
          isActive 
            ? "text-amber-700 font-semibold" 
            : "text-gray-700 group-hover:text-amber-600"
        )}
      >
        {category.name}
      </span>

      {/* Bottom Indicator Line */}
      <div
        className={cn(
          "mt-2 h-0.5 bg-amber-400 transition-all duration-200",
          isActive ? "w-8 opacity-100" : "w-0 opacity-0 group-hover:w-6 group-hover:opacity-50"
        )}
      />
    </div>
  )
}

interface DropdownProps {
  category: NavigationCategory
}

function DesktopDropdown({ category }: DropdownProps) {
  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {category.groups.map((group, index) => (
          <div 
            key={group.id} 
            className="space-y-4"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide border-b border-amber-200 pb-2 flex items-center">
              {group.title}
              <div className="ml-2 w-4 h-0.5 bg-amber-400"></div>
            </h3>
            <ul className="space-y-2">
              {group.subcategories.map((subcategory, subIndex) => (
                <li 
                  key={subcategory.id}
                  style={{ animationDelay: `${(index * 50) + (subIndex * 25)}ms` }}
                >
                  <Link
                    href={subcategory.href}
                    className="text-gray-600 hover:text-amber-600 text-sm transition-all duration-200 block py-1 px-2 rounded hover:bg-amber-50 hover:translate-x-1"
                  >
                    {subcategory.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      {/* View All Link */}
      <div className="mt-8 pt-6 border-t border-gray-200 text-center">
        <Link
          href={category.href}
          className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-medium rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          View All {category.name}
          <ChevronDown className="ml-2 h-4 w-4 rotate-[-90deg] transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  )
}

interface MobileDropdownProps extends DropdownProps {
  onClose: () => void
}

function MobileDropdown({ category, onClose }: MobileDropdownProps) {
  return (
    <div className="max-h-[70vh] overflow-y-auto">
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-amber-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-white/50">
            <Image
              src={category.icon || `/category-icons/${category.slug}.png`}
              alt={category.name}
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">{category.name}</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-white/50"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile Content */}
      <div className="p-4 space-y-6">
        {category.groups.map((group, index) => (
          <div 
            key={group.id} 
            className="space-y-3"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide flex items-center">
              {group.title}
              <div className="ml-2 flex-1 h-0.5 bg-amber-200"></div>
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {group.subcategories.map((subcategory, subIndex) => (
                <Link
                  key={subcategory.id}
                  href={subcategory.href}
                  onClick={onClose}
                  className="text-gray-600 hover:text-amber-600 text-sm transition-all duration-200 block py-3 px-3 rounded-lg hover:bg-amber-50 border border-transparent hover:border-amber-200"
                  style={{ animationDelay: `${(index * 100) + (subIndex * 50)}ms` }}
                >
                  {subcategory.name}
                </Link>
              ))}
            </div>
          </div>
        ))}
        
        {/* Mobile View All */}
        <div className="pt-4 border-t border-gray-200">
          <Link
            href={category.href}
            onClick={onClose}
            className="block w-full text-center px-6 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-medium rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-200 shadow-lg"
          >
            View All {category.name}
          </Link>
        </div>
      </div>
    </div>
  )
}