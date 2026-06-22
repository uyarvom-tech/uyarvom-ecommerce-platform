'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface SizeOption {
  id: string
  size: string
  price: number | null
  stock: number
  isActive: boolean
  sku?: string | null
}

interface ProductSizeSelectorProps {
  sizes: SizeOption[]
  selectedVariantId: string | null
  onSizeChange: (variantId: string) => void
}

export default function ProductSizeSelector({
  sizes,
  selectedVariantId,
  onSizeChange,
}: ProductSizeSelectorProps) {
  const activeSizes = sizes.filter((variant) => variant.isActive)

  if (activeSizes.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-primary sm:text-[10px] sm:tracking-[0.3em]">
          Size
        </span>
        <span className="text-[9px] uppercase tracking-widest font-medium text-foreground/40 sm:text-[10px]">
          Select a size
        </span>
      </div>

      <Select value={selectedVariantId || undefined} onValueChange={onSizeChange}>
        <SelectTrigger className="h-11 rounded-none border-border">
          <SelectValue placeholder="Choose a size" />
        </SelectTrigger>
        <SelectContent>
          {activeSizes.map((variant) => (
            <SelectItem key={variant.id} value={variant.id} disabled={variant.stock <= 0}>
              <span className="flex items-center justify-between gap-4">
                <span>{variant.size}</span>
                <span className="text-xs text-muted-foreground">
                  {variant.stock > 0 ? `${variant.stock} in stock` : 'Out of stock'}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
