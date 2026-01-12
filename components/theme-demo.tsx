'use client'

import { useTheme } from 'next-themes'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'

export function ThemeDemo() {
  const { theme } = useTheme()

  return (
    <Card className="apple-card p-6 max-w-md mx-auto">
      <CardContent className="p-0">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-semibold">Theme Demo</h3>
          <p className="apple-body">
            Current theme: <span className="font-semibold capitalize">{theme || 'system'}</span>
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <span className="apple-body text-sm">Toggle theme:</span>
            <ThemeToggle />
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-6">
            <Button variant="default" size="sm">Primary</Button>
            <Button variant="outline" size="sm">Outline</Button>
            <Button variant="secondary" size="sm">Secondary</Button>
            <Button variant="ghost" size="sm">Ghost</Button>
          </div>
          
          <div className="p-4 rounded-2xl bg-secondary/50 border border-border/50">
            <p className="apple-body text-sm">
              This card demonstrates how the theme affects colors, shadows, and overall appearance.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
