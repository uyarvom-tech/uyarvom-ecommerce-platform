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
    let rafId: number

    const handleScroll = () => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        rafId = 0
        const containerRect = container.getBoundingClientRect()
        const containerTop = containerRect.top
        const containerHeight = containerRect.height
        const windowHeight = window.innerHeight

        const scrollStart = windowHeight * 0.8
        const scrollEnd = containerHeight + windowHeight * 0.6
        const scrollProgress = Math.max(0, Math.min(1, (scrollStart - containerTop) / scrollEnd))

        items.forEach((item, index) => {
          const element = item as HTMLElement
          const itemStartProgress = (index * 0.6) / items.length
          const itemEndProgress = ((index + 1) * 0.6) / items.length
          let itemProgress = 0
          if (scrollProgress > itemStartProgress) {
            const progressRange = itemEndProgress - itemStartProgress
            itemProgress = Math.min(1, (scrollProgress - itemStartProgress) / progressRange)
          }
          const easeProgress = itemProgress < 0.5
            ? 2 * itemProgress * itemProgress
            : 1 - Math.pow(-2 * itemProgress + 2, 3) / 2
          const translateY = (1 - easeProgress) * 20
          const scale = 0.92 + (easeProgress * 0.08)
          const opacity = easeProgress < 0.15 ? 0 : 1
          const rotate = (1 - easeProgress) * 1.5
          element.style.transform = `translateY(${translateY}%) scale(${scale}) rotate(${rotate}deg)`
          element.style.opacity = opacity.toString()
          element.style.zIndex = (index + 1).toString()
          element.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none'
          element.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out'
        })
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafId) cancelAnimationFrame(rafId)
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
