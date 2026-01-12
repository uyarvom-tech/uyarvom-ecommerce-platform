'use client'

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthButton } from "@/components/auth-button"
import { ProductsSearch } from "@/components/products-search"
import { gsap } from "gsap"
import type { User } from "@supabase/supabase-js"

interface MobileMenuProps {
  user: User | null
}

export function MobileMenu({ user }: MobileMenuProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const linksRef = useRef<HTMLDivElement[]>([])
  const tl = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    // Initialize timeline
    tl.current = gsap.timeline({ paused: true })
    
    if (menuRef.current && overlayRef.current && linksRef.current.length > 0) {
      // Set initial states
      gsap.set(menuRef.current, { x: -320 })
      gsap.set(overlayRef.current, { opacity: 0 })
      gsap.set(linksRef.current, { x: -50, opacity: 0 })

      // Build animation timeline
      tl.current
        .to(overlayRef.current, {
          opacity: 1,
          duration: 0.3,
          ease: "power2.out"
        })
        .to(menuRef.current, {
          x: 0,
          duration: 0.4,
          ease: "power3.out"
        }, "-=0.2")
        .to(linksRef.current, {
          x: 0,
          opacity: 1,
          duration: 0.3,
          stagger: 0.05,
          ease: "power2.out"
        }, "-=0.2")
    }
  }, [])

  // Close mobile menu when clicking outside or on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMobileMenu()
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
    if (isMobileMenuOpen) {
      closeMobileMenu()
    } else {
      setIsMobileMenuOpen(true)
      tl.current?.play()
    }
  }

  const closeMobileMenu = () => {
    tl.current?.reverse()
    setTimeout(() => setIsMobileMenuOpen(false), 400)
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
          ref={overlayRef}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div 
          ref={menuRef}
          className="fixed top-0 left-0 h-full w-80 bg-card/95 backdrop-blur-md border-r border-border/50 z-50 md:hidden shadow-2xl"
        >
          <div className="flex flex-col h-full">
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <Image
                src="/logos/logo_with_title.png"
                alt="Uyarvom"
                width={120}
                height={48}
                className="h-8 w-auto"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-primary/10"
                onClick={closeMobileMenu}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close menu</span>
              </Button>
            </div>

            {/* Mobile Navigation Links */}
            <nav className="flex-1 px-6 py-6">
              <div className="space-y-2">
                {/* Mobile Search Bar */}
                <div 
                  ref={(el) => { if (el) linksRef.current[0] = el }}
                  className="transform mb-6"
                >
                  <ProductsSearch />
                </div>

                {/* Mobile Menu Divider */}
                <div 
                  ref={(el) => { if (el) linksRef.current[1] = el }}
                  className="border-t border-border/50 my-6 transform"
                ></div>

                {/* Mobile Menu Actions */}
                <div 
                  ref={(el) => { if (el) linksRef.current[2] = el }}
                  className="space-y-2 transform"
                >
                  <Link 
                    href="/wishlist" 
                    className="flex items-center gap-3 py-4 px-4 text-lg font-medium text-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200"
                    onClick={closeMobileMenu}
                  >
                    <Heart className="h-5 w-5" />
                    Wishlist
                  </Link>
                </div>
              </div>
            </nav>

            {/* Mobile Menu Footer - Auth Section */}
            <div 
              ref={(el) => { if (el) linksRef.current[3] = el }}
              className="p-6 border-t border-border/50 transform"
            >
              {user ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">
                        {user.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Signed in
                      </p>
                    </div>
                  </div>
                  <Link 
                    href="/account" 
                    className="block w-full py-3 px-4 text-center text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-xl transition-colors"
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
                    className="block w-full py-4 px-4 text-center text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors shadow-lg"
                    onClick={closeMobileMenu}
                  >
                    Sign In
                  </Link>
                  <Link 
                    href="/auth/signup" 
                    className="block w-full py-4 px-4 text-center text-sm font-semibold text-primary bg-transparent border-2 border-primary hover:bg-primary hover:text-white rounded-xl transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
