'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X, Heart, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthButton } from "@/components/auth-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { ProductFilters } from "@/components/product-filters"
import type { User } from "@supabase/supabase-js"

interface ProductsMobileMenuProps {
  user: User | null
  categories: any[]
}

export function ProductsMobileMenu({ user, categories }: ProductsMobileMenuProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Close mobile menu when clicking outside or on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 hover:bg-white/20 text-white/90 hover:text-white transition-all duration-300 mr-3"
        onClick={toggleMobileMenu}
      >
        {isMobileMenuOpen ? (
          <X className="h-4 w-4" />
        ) : (
          <Menu className="h-4 w-4" />
        )}
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Menu */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-card border-r border-border z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Menu & Filters</h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={closeMobileMenu}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close menu</span>
            </Button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Mobile Navigation Links */}
            <nav className="px-6 py-4 border-b border-border">
              <div className="space-y-4">
                <Link 
                  href="/" 
                  className="block py-3 text-lg font-medium text-foreground hover:text-primary transition-colors"
                  onClick={closeMobileMenu}
                >
                  Home
                </Link>
                <Link 
                  href="/products" 
                  className="block py-3 text-lg font-medium text-primary"
                  onClick={closeMobileMenu}
                >
                  Store
                </Link>
                <Link 
                  href="/categories" 
                  className="block py-3 text-lg font-medium text-foreground hover:text-primary transition-colors"
                  onClick={closeMobileMenu}
                >
                  Categories
                </Link>
                <Link 
                  href="/about" 
                  className="block py-3 text-lg font-medium text-foreground hover:text-primary transition-colors"
                  onClick={closeMobileMenu}
                >
                  About
                </Link>
                <Link 
                  href="/support" 
                  className="block py-3 text-lg font-medium text-foreground hover:text-primary transition-colors"
                  onClick={closeMobileMenu}
                >
                  Support
                </Link>
              </div>
            </nav>

            {/* Product Filters Section */}
            <div className="px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Filters</h3>
              </div>
              <ProductFilters categories={categories} />
            </div>

            {/* Mobile Menu Actions */}
            <div className="px-6 py-4">
              <div className="space-y-4">
                <Link 
                  href="/wishlist" 
                  className="flex items-center gap-3 py-3 text-lg font-medium text-foreground hover:text-primary transition-colors"
                  onClick={closeMobileMenu}
                >
                  <Heart className="h-5 w-5" />
                  Wishlist
                </Link>
                
                <div className="flex items-center gap-3 py-3">
                  <span className="text-lg font-medium text-foreground">Theme</span>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Menu Footer - Auth Section */}
          <div className="p-6 border-t border-border">
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Signed in
                    </p>
                  </div>
                </div>
                <Link 
                  href="/account" 
                  className="block w-full py-3 px-4 text-center text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                  onClick={closeMobileMenu}
                >
                  My Account
                </Link>
                <AuthButton />
              </div>
            ) : (
              <div className="space-y-3">
                <Link 
                  href="/auth/signin" 
                  className="block w-full py-3 px-4 text-center text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
                  onClick={closeMobileMenu}
                >
                  Sign In
                </Link>
                <Link 
                  href="/auth/signup" 
                  className="block w-full py-3 px-4 text-center text-sm font-medium text-primary bg-transparent border border-primary hover:bg-primary hover:text-white rounded-lg transition-colors"
                  onClick={closeMobileMenu}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
