'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

type Variant = {
  id: string
  size: string | null
  stock: number
  price: number | null
  sku: string | null
  isActive: boolean
  sortOrder: number
}

type ColorGroup = {
  id: string
  colorName: string
  colorCode: string | null
  variants: Variant[]
}

type Props = {
  productId: string
  colors: ColorGroup[]
}

export function VariantStockManager({ productId, colors }: Props) {
  const router = useRouter()
  const [draftStocks, setDraftStocks] = useState<Record<string, string>>({})
  const [savingVariantId, setSavingVariantId] = useState<string | null>(null)

  useEffect(() => {
    const nextDrafts: Record<string, string> = {}

    for (const color of colors) {
      for (const variant of color.variants) {
        nextDrafts[variant.id] = String(variant.stock ?? 0)
      }
    }

    setDraftStocks(nextDrafts)
  }, [colors])

  const totalStock = useMemo(() => {
    return colors.reduce((sum, color) => {
      return (
        sum +
        color.variants.reduce((variantSum, variant) => {
          return variantSum + Number(variant.stock || 0)
        }, 0)
      )
    }, 0)
  }, [colors])

  const updateVariantStock = async (variantId: string) => {
    const nextValue = draftStocks[variantId]
    const parsed = Number.parseInt(nextValue, 10)

    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error('Please enter a valid stock quantity')
      return
    }

    setSavingVariantId(variantId)

    try {
      const response = await fetch(`/api/admin/products/${productId}/variants/${variantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: parsed }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update variant stock')
      }

      toast.success('Variant stock updated')
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update variant stock')
    } finally {
      setSavingVariantId(null)
    }
  }

  if (colors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Variant Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No colors or size variants have been configured yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Variant Stock Total</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{totalStock}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Derived from all color and size variants. There is no product-level stock override.
          </p>
        </CardContent>
      </Card>

      {colors.map((color) => (
        <Card key={color.id}>
          <CardHeader>
            <CardTitle>{color.colorName}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {color.variants.length} size variant{color.variants.length === 1 ? '' : 's'}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {color.variants
              .slice()
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((variant) => {
                const sizeLabel = variant.size || 'Size'

                return (
                  <div key={variant.id} className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_120px_auto] md:items-end">
                    <div>
                      <Label className="text-xs text-muted-foreground">Size</Label>
                      <div className="mt-1 font-medium">{sizeLabel}</div>
                      <p className="text-xs text-muted-foreground">
                        SKU: {variant.sku || 'Not set'} {variant.isActive ? '' : '• Inactive'}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor={`stock-${variant.id}`}>Stock</Label>
                      <Input
                        id={`stock-${variant.id}`}
                        type="number"
                        min="0"
                        value={draftStocks[variant.id] ?? '0'}
                        onChange={(e) =>
                          setDraftStocks((prev) => ({
                            ...prev,
                            [variant.id]: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <Button
                      type="button"
                      onClick={() => updateVariantStock(variant.id)}
                      disabled={savingVariantId === variant.id}
                    >
                      {savingVariantId === variant.id ? 'Saving...' : 'Save Stock'}
                    </Button>
                  </div>
                )
              })}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
