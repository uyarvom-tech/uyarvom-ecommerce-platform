'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 hover:bg-white/20 text-white/90 transition-all duration-300"
      >
        <div className="h-4 w-4" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  const isDark = theme === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="h-8 w-8 hover:bg-white/20 text-white/90 hover:text-white transition-all duration-300 active:scale-95 relative overflow-hidden"
    >
      {/* Gold animated background */}
      <div 
        className={`absolute inset-0 rounded-full transition-all duration-500 ${
          isDark 
            ? 'bg-blue-400/20' 
            : 'bg-yellow-400/20'
        }`}
      />
      
      {/* Icon container with smooth transitions */}
      <div className="relative h-4 w-4 flex items-center justify-center">
        <Sun 
          className={`h-4 w-4 absolute transition-all duration-500 ease-out ${
            !isDark 
              ? 'rotate-0 scale-100 opacity-100' 
              : 'rotate-90 scale-0 opacity-0'
          }`}
        />
        <Moon 
          className={`h-4 w-4 absolute transition-all duration-500 ease-out ${
            isDark 
              ? 'rotate-0 scale-100 opacity-100' 
              : '-rotate-90 scale-0 opacity-0'
          }`}
        />
      </div>
      
      <span className="sr-only">
        {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      </span>
    </Button>
  )
}
