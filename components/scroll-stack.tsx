'use client'

import { useEffect, useRef, ReactNode } from 'react'

interface ScrollStackItemProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

interface ScrollStackProps {
  children: ReactNode
  className?: string
}

export function ScrollStackItem({ children, className = '', style }: ScrollStackItemProps) {
  return (
    <div className={`scroll-stack-item ${className}`} style={style}>
      {children}
    </div>
  )
}

export default function ScrollStack({ children, className = '' }: ScrollStackProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const items = container.querySelectorAll('.scroll-stack-item')

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect()
      const containerTop = containerRect.top
      const containerHeight = containerRect.height
      const windowHeight = window.innerHeight

      // Calculate overall progress through the container with adjusted bounds for shorter height
      const scrollStart = windowHeight * 0.8 // Start earlier
      const scrollEnd = containerHeight + windowHeight * 0.6 // End earlier
      const scrollProgress = Math.max(0, Math.min(1, (scrollStart - containerTop) / scrollEnd))

      items.forEach((item, index) => {
        const element = item as HTMLElement
        
        // Adjust timing for faster progression due to shorter height
        const itemStartProgress = (index * 0.6) / items.length // Faster progression
        const itemEndProgress = ((index + 1) * 0.6) / items.length
        
        // Calculate individual item progress with better bounds
        let itemProgress = 0
        if (scrollProgress > itemStartProgress) {
          const progressRange = itemEndProgress - itemStartProgress
          itemProgress = Math.min(1, (scrollProgress - itemStartProgress) / progressRange)
        }
        
        // Smooth easing function with better curve
        const easeProgress = itemProgress < 0.5 
          ? 2 * itemProgress * itemProgress 
          : 1 - Math.pow(-2 * itemProgress + 2, 3) / 2
        
        // Calculate transforms for upward stacking effect (adjusted for shorter height)
        const translateY = (1 - easeProgress) * 20 // Further reduced movement for shorter cards
        const scale = 0.92 + (easeProgress * 0.08) // Subtle scaling
        const opacity = easeProgress < 0.15 ? 0 : 1 // Earlier visibility threshold
        const rotate = (1 - easeProgress) * 1.5 // Minimal rotation
        
        // Apply transforms
        element.style.transform = `translateY(${translateY}%) scale(${scale}) rotate(${rotate}deg)`
        element.style.opacity = opacity.toString()
        element.style.zIndex = (index + 1).toString()
        element.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none'
        
        // Smoother transitions
        element.style.transition = 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      })
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Initial call

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div ref={containerRef} className={`scroll-stack-container ${className}`}>
      <div className="scroll-stack">
        {children}
      </div>
    </div>
  )
}