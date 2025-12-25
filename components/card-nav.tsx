'use client'

import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import Link from 'next/link'
import Image from 'next/image'
import { X } from 'lucide-react'

interface NavLink {
  label: string
  ariaLabel: string
  href?: string
}

interface NavItem {
  label: string
  bgColor: string
  textColor: string
  links: NavLink[]
}

interface CardNavProps {
  logo?: string
  logoAlt?: string
  items: NavItem[]
  baseColor?: string
  menuColor?: string
  buttonBgColor?: string
  buttonTextColor?: string
  ease?: string
}

export default function CardNav({
  logo,
  logoAlt = "Logo",
  items,
  baseColor = "#fff",
  menuColor = "#000",
  buttonBgColor = "#111",
  buttonTextColor = "#fff",
  ease = "power3.out"
}: CardNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement[]>([])
  const tl = useRef<gsap.core.Timeline>()

  useEffect(() => {
    // Initialize timeline
    tl.current = gsap.timeline({ paused: true })
    
    if (overlayRef.current && cardsRef.current.length > 0) {
      // Set initial states
      gsap.set(overlayRef.current, { opacity: 0, visibility: "hidden" })
      gsap.set(cardsRef.current, { 
        y: 100, 
        opacity: 0, 
        scale: 0.8,
        rotation: 5
      })

      // Build animation timeline
      tl.current
        .to(overlayRef.current, {
          opacity: 1,
          visibility: "visible",
          duration: 0.3,
          ease: ease
        })
        .to(cardsRef.current, {
          y: 0,
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: ease
        }, "-=0.2")
    }
  }, [ease])

  const toggleMenu = () => {
    if (isOpen) {
      // Close animation
      tl.current?.reverse()
      setTimeout(() => setIsOpen(false), 300)
    } else {
      setIsOpen(true)
      tl.current?.play()
    }
  }

  const closeMenu = () => {
    tl.current?.reverse()
    setTimeout(() => setIsOpen(false), 300)
  }

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeMenu()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <>
      {/* Menu Toggle Button */}
      <button
        onClick={toggleMenu}
        className="relative z-50 flex flex-col justify-center items-center w-8 h-8 focus:outline-none"
        aria-label="Toggle navigation menu"
        style={{ color: baseColor }}
      >
        <span 
          className={`block w-6 h-0.5 transition-all duration-300 ${
            isOpen ? 'rotate-45 translate-y-1.5' : ''
          }`}
          style={{ backgroundColor: isOpen ? buttonTextColor : baseColor }}
        />
        <span 
          className={`block w-6 h-0.5 mt-1 transition-all duration-300 ${
            isOpen ? 'opacity-0' : ''
          }`}
          style={{ backgroundColor: baseColor }}
        />
        <span 
          className={`block w-6 h-0.5 mt-1 transition-all duration-300 ${
            isOpen ? '-rotate-45 -translate-y-1.5' : ''
          }`}
          style={{ backgroundColor: isOpen ? buttonTextColor : baseColor }}
        />
      </button>

      {/* Menu Overlay */}
      {isOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-40 flex items-center justify-center p-4"
          style={{ backgroundColor: `${menuColor}CC` }}
          onClick={closeMenu}
        >
          {/* Close Button */}
          <button
            onClick={closeMenu}
            className="absolute top-6 right-6 z-50 p-2 rounded-full transition-colors duration-200"
            style={{ 
              backgroundColor: buttonBgColor,
              color: buttonTextColor 
            }}
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Logo */}
          {logo && (
            <div className="absolute top-6 left-6 z-50">
              <Image
                src={logo}
                alt={logoAlt}
                width={120}
                height={40}
                className="h-8 w-auto"
              />
            </div>
          )}

          {/* Brand Name when no logo */}
          {!logo && (
            <div className="absolute top-6 left-6 z-50">
              <span className="text-xl font-bold text-white">Uyarvom</span>
            </div>
          )}

          {/* Navigation Cards */}
          <div 
            className="grid gap-6 max-w-4xl w-full"
            style={{ 
              gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, 1fr)` 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {items.map((item, index) => (
              <div
                key={item.label}
                ref={(el) => {
                  if (el) cardsRef.current[index] = el
                }}
                className="relative overflow-hidden rounded-2xl p-8 min-h-[300px] flex flex-col justify-between cursor-pointer transform transition-transform duration-300 hover:scale-105"
                style={{ 
                  backgroundColor: item.bgColor,
                  color: item.textColor 
                }}
              >
                {/* Card Header */}
                <div>
                  <h3 className="text-2xl font-bold mb-6">{item.label}</h3>
                  
                  {/* Navigation Links */}
                  <nav className="space-y-3">
                    {item.links.map((link, linkIndex) => (
                      <Link
                        key={linkIndex}
                        href={link.href || '#'}
                        className="block text-lg opacity-80 hover:opacity-100 transition-opacity duration-200"
                        aria-label={link.ariaLabel}
                        onClick={closeMenu}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                </div>

                {/* Card Footer/Decoration */}
                <div className="mt-8">
                  <div 
                    className="w-12 h-1 rounded-full opacity-50"
                    style={{ backgroundColor: item.textColor }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}