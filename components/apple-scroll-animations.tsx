'use client'

import { useEffect, useRef } from 'react'

interface AppleRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function AppleReveal({ children, className = '', delay = 0 }: AppleRevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add('visible')
            }, delay)
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [delay])

  return (
    <div ref={ref} className={`apple-reveal ${className}`}>
      {children}
    </div>
  )
}

interface AppleParallaxProps {
  children: React.ReactNode
  className?: string
  speed?: number
}

export function AppleParallax({ children, className = '', speed = 0.5 }: AppleParallaxProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (ref.current) {
        const scrolled = window.pageYOffset
        const parallax = scrolled * speed
        ref.current.style.transform = `translateY(${parallax}px)`
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [speed])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

interface AppleStickyScrollProps {
  children: React.ReactNode
  className?: string
}

export function AppleStickyScroll({ children, className = '' }: AppleStickyScrollProps) {
  return (
    <div className={`apple-sticky-section ${className}`}>
      {children}
    </div>
  )
}