type VariantLike = {
  id?: string
  size?: string | null
  price?: number | null
  stock?: number | null
  isActive?: boolean | null
  sku?: string | null
  sortOrder?: number | null
}

type ColorLike = {
  id?: string
  colorName?: string | null
  colorCode?: string | null
  images?: Array<any>
  variants?: VariantLike[]
}

type ProductLike = {
  colors?: ColorLike[]
  variants?: VariantLike[]
  lowStockThreshold?: number | null
}

function getSortedVariants(product: ProductLike): VariantLike[] {
  const colorVariants = (product.colors || []).flatMap((color) => color.variants || [])
  const directVariants = product.variants || []
  const variants = colorVariants.length > 0 ? colorVariants : directVariants

  return [...variants].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
}

export function getVariantStockTotal(product: ProductLike): number {
  return getSortedVariants(product)
    .filter((variant) => variant.isActive !== false)
    .reduce((sum, variant) => sum + Number(variant.stock || 0), 0)
}

export function getVariantLowStockThreshold(product: ProductLike, fallback = 10): number {
  const threshold = Number(product.lowStockThreshold ?? fallback)
  return Number.isFinite(threshold) ? threshold : fallback
}

export function getDefaultVariant(product: ProductLike): VariantLike | null {
  const variants = getSortedVariants(product).filter((variant) => variant.isActive !== false)
  return variants.find((variant) => Number(variant.stock || 0) > 0) || variants[0] || null
}

export function getVariantStockSummary(product: ProductLike) {
  const variants = getSortedVariants(product)
  const total = getVariantStockTotal(product)
  const threshold = getVariantLowStockThreshold(product)

  return {
    total,
    hasVariants: variants.length > 0,
    activeVariants: variants.filter((variant) => variant.isActive !== false),
    lowStockVariants: variants.filter((variant) => variant.isActive !== false && Number(variant.stock || 0) > 0 && Number(variant.stock || 0) <= threshold),
    outOfStockVariants: variants.filter((variant) => Number(variant.stock || 0) <= 0),
  }
}
