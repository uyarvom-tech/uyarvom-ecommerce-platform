'use client'

import { useEffect, useState } from 'react'

export default function CursorGlow() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
      setIsVisible(true)
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <>
      {/* Light mode glow */}
      <div
        className="pointer-events-none fixed z-50 transition-opacity duration-300 dark:hidden"
        style={{
          left: mousePosition.x - 50,
          top: mousePosition.y - 50,
          opacity: isVisible ? 1 : 0,
          width: '100px',
          height: '100px',
          background: `radial-gradient(circle, 
            rgba(201, 135, 29, 0.6) 0%, 
            rgba(201, 135, 29, 0.4) 30%, 
            rgba(201, 135, 29, 0.2) 60%, 
            transparent 100%
          )`,
          borderRadius: '50%',
          filter: 'blur(12px)',
          mixBlendMode: 'multiply',
        }}
      />
      
      {/* Dark mode glow */}
      <div
        className="pointer-events-none fixed z-50 transition-opacity duration-300 hidden dark:block"
        style={{
          left: mousePosition.x - 50,
          top: mousePosition.y - 50,
          opacity: isVisible ? 1 : 0,
          width: '100px',
          height: '100px',
          background: `radial-gradient(circle, 
            rgba(201, 135, 29, 0.8) 0%, 
            rgba(201, 135, 29, 0.5) 30%, 
            rgba(201, 135, 29, 0.3) 60%, 
            transparent 100%
          )`,
          borderRadius: '50%',
          filter: 'blur(12px)',
          mixBlendMode: 'screen',
        }}
      />
    </>
  )
}