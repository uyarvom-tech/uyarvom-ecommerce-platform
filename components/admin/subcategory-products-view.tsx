'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Plus, 
  Edit,
  Eye,
  ChevronRight,
  ChevronLeft,
  Package
} from "lucide-react"

interface Product {
  id: string
  name: string
  slug: string
  sku: string
  price: number
  stockQuantity: number
  isActive: boolean
}

interface SubCategory {
  id: string
  name: string
  slug: string
  description: string | null
}

interface MainCategory {
  id: string
  name: string
  slug: string
}

interface SubCategoryProductsViewProps {
  mainCategory: MainCategory
  subCategory: SubCategory
  products: Product[]
}

export function SubCategoryProductsView({ mainCategory, subCategory, products }: SubCategoryProductsViewProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="space-y-4">
      {/* Header with Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/catalog/${mainCategory.id}`)}
            className="p-1"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <button 
                onClick={() => router.push('/admin/catalog')}
                className="hover:text-foreground transition-colors"
              >
                Categories
              </button>
              <ChevronRight className="h-3 w-3" />
              <button 
                onClick={() => router.push(`/admin/catalog/${mainCategory.id}`)}
                className="hover:text-foreground transition-colors"
              >
                {mainCategory.name}
              </button>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">{subCategory.name}</span>
            </div>
            <h1 className="text-2xl font-semibold">{subCategory.name}</h1>
            {subCategory.description && (
              <p className="text-sm text-muted-foreground">{subCategory.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/catalog/${mainCategory.id}/${subCategory.id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Sub-Category
          </Button>
          <Button onClick={() => router.push(`/admin/products/new?mainCategory=${mainCategory.id}&subCategory=${subCategory.id}`)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredProducts.length} products
        </div>
      </div>

      {/* Products Table */}
      <div className="border rounded-lg">
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? `No products match "${searchQuery}"` 
                : `Add your first product to "${subCategory.name}"`
              }
            </p>
            <Button onClick={() => router.push(`/admin/products/new?mainCategory=${mainCategory.id}&subCategory=${subCategory.id}`)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-3 bg-muted/50 border-b text-sm font-medium text-muted-foreground">
              <div className="col-span-4">Product Name</div>
              <div className="col-span-2">SKU</div>
              <div className="col-span-2">Price</div>
              <div className="col-span-2">Stock</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1">Actions</div>
            </div>
            
            {/* Table Body */}
            <div className="divide-y">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="grid grid-cols-12 gap-4 p-3 hover:bg-muted/50 transition-colors group"
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <Package className="h-4 w-4 text-purple-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{product.name}</div>
                      <div className="text-sm text-muted-foreground truncate">{product.slug}</div>
                    </div>
                  </div>
                  
                  <div className="col-span-2 flex items-center">
                    <span className="text-sm font-mono">{product.sku}</span>
                  </div>
                  
                  <div className="col-span-2 flex items-center">
                    <span className="font-medium">{formatPrice(product.price)}</span>
                  </div>
                  
                  <div className="col-span-2 flex items-center">
                    <span className={`text-sm ${product.stockQuantity <= 10 ? 'text-red-600' : 'text-green-600'}`}>
                      {product.stockQuantity}
                    </span>
                  </div>
                  
                  <div className="col-span-1 flex items-center">
                    <Badge variant={product.isActive ? "default" : "secondary"} className="text-xs">
                      {product.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  
                  <div className="col-span-1 flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/admin/products/${product.id}`)}
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
