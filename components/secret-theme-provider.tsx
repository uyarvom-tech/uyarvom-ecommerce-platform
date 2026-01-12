'use client'

import { useEffect, useState } from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes'

export function SecretThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [secretTheme, setSecretTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+Q (or Cmd+Q on Mac)
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'q') {
        event.preventDefault()
        setSecretTheme(prev => prev === 'light' ? 'dark' : 'light')
        
        // Optional: Show a subtle notification
        const notification = document.createElement('div')
        notification.textContent = `🎨 Developer theme: ${secretTheme === 'light' ? 'Dark' : 'Light'}`
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          z-index: 9999;
          animation: fadeInOut 2s ease-in-out;
        `
        
        // Add fade animation
        const style = document.createElement('style')
        style.textContent = `
          @keyframes fadeInOut {
            0%, 100% { opacity: 0; transform: translateY(-10px); }
            20%, 80% { opacity: 1; transform: translateY(0); }
          }
        `
        document.head.appendChild(style)
        document.body.appendChild(notification)
        
        setTimeout(() => {
          document.body.removeChild(notification)
          document.head.removeChild(style)
        }, 2000)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [secretTheme])

  return (
    <NextThemesProvider
      {...props}
      forcedTheme={secretTheme}
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  )
}