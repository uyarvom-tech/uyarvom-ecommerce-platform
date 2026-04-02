'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

type ReplenishVariant = {
  productId: string
  productName: string
  colorName: string
  size: string
  stock: number
  threshold: number
  status: 'low' | 'out'
}

type ReplenishResponse = {
  checkedAt: string
  totalVariants: number
  lowStockVariants: ReplenishVariant[]
}

export function InventoryReplenishButton() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<ReplenishResponse | null>(null)

  const runCheck = async () => {
    setIsRunning(true)

    try {
      const response = await fetch('/api/admin/inventory/replenish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to run replenish check')
      }

      setResult(payload)
      toast.success(`Found ${payload.lowStockVariants.length} low-stock variant(s)`)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to run replenish check')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        onClick={runCheck}
        disabled={isRunning}
        className="w-full h-11 border border-white/20 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all bg-transparent text-white rounded-none"
      >
        <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
        {isRunning ? 'Scanning...' : 'Run Auto-Replenish Check'}
      </Button>

      {result && (
        <Card className="rounded-none border border-white/10 bg-white/5 text-white">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/60">
              <span>Scan complete</span>
              <span>{new Date(result.checkedAt).toLocaleTimeString()}</span>
            </div>
            <p className="text-sm font-bold">
              {result.lowStockVariants.length === 0
                ? 'No variants need replenishment.'
                : `${result.lowStockVariants.length} variant(s) are low or out of stock.`}
            </p>
            {result.lowStockVariants.length > 0 && (
              <div className="space-y-2">
                {result.lowStockVariants.slice(0, 5).map((variant) => (
                  <div key={`${variant.productId}-${variant.colorName}-${variant.size}`} className="flex items-center justify-between border-t border-white/10 pt-2 text-[10px] uppercase tracking-widest">
                    <span>{variant.productName}</span>
                    <span>{variant.colorName} / {variant.size}</span>
                    <span>{variant.stock} / {variant.threshold}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
