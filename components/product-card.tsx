import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"

export function ProductCard({ product }: { product: any }) {
  const primaryImage = product.images?.find((img: any) => img.is_primary) || product.images?.[0]
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0
  const isLowStock = product.stock_quantity <= product.low_stock_threshold && product.stock_quantity > 0
  const isNew = new Date(product.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days

  return (
    <Link href={`/products/${product.slug}`} className="group">
      <Card className="overflow-hidden border-0 bg-card shadow-md transition-all hover:shadow-2xl hover:-translate-y-1">
        <div className="relative aspect-square overflow-hidden bg-secondary/30">
          <Image
            src={primaryImage?.image_url || `/placeholder.svg?height=500&width=500&query=${product.name}`}
            alt={primaryImage?.alt_text || product.name}
            width={500}
            height={500}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />

          <div className="absolute right-3 top-3 flex flex-col gap-2">
            {hasDiscount && (
              <Badge className="bg-destructive text-destructive-foreground border-0 px-3 py-1.5 font-bold shadow-lg">
                {discountPercent}% OFF
              </Badge>
            )}
            {isNew && <Badge className="bg-blue-500 text-white border-0 px-3 py-1.5 font-bold shadow-lg">NEW</Badge>}
            {product.stock_quantity <= 0 && (
              <Badge variant="secondary" className="backdrop-blur-sm">
                Out of Stock
              </Badge>
            )}
          </div>

          {isLowStock && (
            <div className="absolute bottom-3 left-3">
              <Badge
                variant="secondary"
                className="border border-destructive/30 bg-destructive/10 text-destructive font-semibold backdrop-blur-sm"
              >
                ⚡ Only {product.stock_quantity} left
              </Badge>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100 flex items-end justify-center pb-4">
            <Badge variant="secondary" className="backdrop-blur-sm">
              Quick View
            </Badge>
          </div>
        </div>

        <CardContent className="p-5">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-primary">{product.category?.name}</p>
          <h3 className="mb-2 font-serif text-lg font-semibold leading-tight group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{product.short_description}</p>

          <div className="mb-3 flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-xl font-bold">₹{product.price.toLocaleString("en-IN")}</span>
                {hasDiscount && (
                  <span className="text-sm text-muted-foreground line-through">
                    ₹{product.compare_at_price.toLocaleString("en-IN")}
                  </span>
                )}
              </div>
              {hasDiscount && (
                <span className="text-xs font-medium text-green-600">
                  Save ₹{(product.compare_at_price - product.price).toLocaleString("en-IN")}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-bold text-sm">4.8</span>
              <span className="text-xs text-muted-foreground">(128)</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-t pt-3">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="font-medium">43 people viewing this</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
