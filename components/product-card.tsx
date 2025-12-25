import Link from "next/link"
import Image from "next/image"
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
    <Link href={`/products/${product.slug}`} className="group block h-full">
      <div className="apple-card p-0 h-full apple-hover-lift flex flex-col">
        {/* Apple-style Product Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary/20 rounded-t-[20px] flex-shrink-0">
          <Image
            src={primaryImage?.image_url || `/placeholder.svg?height=400&width=400&query=${product.name}`}
            alt={primaryImage?.alt_text || product.name}
            width={400}
            height={300}
            className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          />

          {/* Apple-style Badges */}
          <div className="absolute right-3 top-3 flex flex-col gap-2">
            {hasDiscount && (
              <Badge className="bg-destructive text-destructive-foreground border-0 px-2 py-1 text-xs font-semibold rounded-full apple-shadow">
                {discountPercent}% OFF
              </Badge>
            )}
            {isNew && (
              <Badge className="bg-primary text-primary-foreground border-0 px-2 py-1 text-xs font-semibold rounded-full apple-shadow">
                NEW
              </Badge>
            )}
            {product.stock_quantity <= 0 && (
              <Badge className="bg-muted text-muted-foreground border-0 px-2 py-1 text-xs font-semibold rounded-full apple-shadow">
                Out of Stock
              </Badge>
            )}
          </div>

          {isLowStock && (
            <div className="absolute bottom-3 left-3">
              <Badge className="bg-amber-500/90 text-white border-0 px-2 py-1 text-xs font-semibold rounded-full apple-shadow backdrop-blur-sm">
                ⚡ Only {product.stock_quantity} left
              </Badge>
            </div>
          )}

          {/* Apple-style Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-all duration-300 group-hover:opacity-100" />
        </div>

        {/* Apple-style Product Info */}
        <div className="p-4 flex flex-col flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
            {product.category?.name}
          </p>
          
          <h3 className="text-lg font-semibold mb-2 leading-tight group-hover:text-primary transition-colors duration-300 min-h-[3.5rem] flex items-start">
            <span className="line-clamp-2">{product.name}</span>
          </h3>
          
          <p className="apple-body text-sm mb-3 line-clamp-2 leading-relaxed flex-1 min-h-[2.5rem]">
            {product.short_description}
          </p>

          {/* Apple-style Pricing */}
          <div className="flex items-center justify-between mb-3 mt-auto">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-semibold tracking-tight">
                  ₹{product.price.toLocaleString("en-IN")}
                </span>
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
              <span className="font-semibold text-sm">4.8</span>
            </div>
          </div>

          {/* Apple-style Social Proof */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>43 people viewing this</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
