'use client'

import { ReactNode, useEffect, useState } from 'react'
import ClickSpark from './ClickSpark'

interface GlobalClickSparkProps {
  children: ReactNode
}

export function GlobalClickSpark({ children }: GlobalClickSparkProps) {
  const [sparkColor, setSparkColor] = useState('#F59E0B')

  useEffect(() => {
    // Function to get the current theme color
    const updateSparkColor = () => {
      const isDark = document.documentElement.classList.contains('dark')
      if (isDark) {
        setSparkColor('#FCD34D') // Amber-300 for dark mode (brighter)
      } else {
        setSparkColor('#F59E0B') // Amber-500 for light mode (brighter)
      }
    }

    // Initial color set
    updateSparkColor()

    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          updateSparkColor()
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

  return (
    <ClickSpark
      sparkColor={sparkColor}
      sparkSize={14}        // Balanced size - between original 10 and max 20
      sparkRadius={30}      // Moderate radius - between original 15 and max 40
      sparkCount={8}        // Moderate count - between original 6 and max 12
      duration={600}        // Moderate duration - between original 400 and max 800ms
      easing="ease-out"
      extraScale={1.3}      // Moderate scale - between original 1.0 and max 1.8
    >
      {children}
    </ClickSpark>
  )
}