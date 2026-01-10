'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { DeletionTicketModal } from "@/components/admin/deletion-ticket-modal"
import { 
  ArrowLeft,
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Package,
  TrendingUp,
  AlertTriangle,
  FolderOpen
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"

interface Product {
  id: string
  name: string
  slug: string
  price: number
  compareAtPrice?: number
  stockQuantity: number
  sku?: string
  isActive: boolean
  isFeatured: boolean
  categories: Array<{
    id: string
    name: string
    isPrimary?: boolean
  }>
  images: Array<{
    imageUrl: string
    isPrimary: boolean
  }>
  createdAt: string
}

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
}

interface CategoryProductsViewProps {
  category: Category
  products: Product[]
  userRole?: string // Add user role prop
}

export function CategoryProductsView({ category, products: initialProducts, userRole = 'staff' }: CategoryProductsViewProps) {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)
  const [deletionTicketOpen, setDeletionTicketOpen] = useState(false)
  const [ticketProductId, setTicketProductId] = useState<string | null>(null)
  const [ticketProductName, setTicketProductName] = useState<string>('')
  
  // Check if user is admin (can delete directly)
  const isAdmin = userRole === 'super_admin'
  
  // Debug logging
  console.log('CategoryProductsView - userRole:', userRole, 'isAdmin:', isAdmin)
  
  // Add effect to log when userRole changes
  useEffect(() => {
    console.log('CategoryProductsView - userRole changed to:', userRole, 'isAdmin:', isAdmin)
  }, [userRole, isAdmin])

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Stats based on filtered products
  const totalProducts = filteredProducts.length
  const activeProducts = filteredProducts.filter(p => p.isActive).length
  const lowStockProducts = filteredProducts.filter(p => p.stockQuantity <= 10).length
  const featuredProducts = filteredProducts.filter(p => p.isFeatured).length

  // Handle product delete
  const handleDelete = (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    if (isAdmin) {
      setProductToDelete(productId)
      setDeleteDialogOpen(true)
    } else {
      // Staff users create deletion ticket
      setTicketProductId(productId)
      setTicketProductName(product.name)
      setDeletionTicketOpen(true)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return

    setIsLoading(true)
    setDeleteDialogOpen(false)
    
    try {
      const response = await fetch(`/api/admin/products/${productToDelete}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        let errorMessage = 'Failed to delete product'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      toast.success('Product deleted successfully')
      
      // Remove deleted product from state
      setProducts(prev => prev.filter(p => p.id !== productToDelete))
      setProductToDelete(null)
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(error.message || 'Failed to delete product')
    } finally {
      setIsLoading(false)
    }
  }

  const getPrimaryImage = (product: Product) => {
    const primaryImage = product.images.find(img => img.isPrimary)
    return primaryImage?.imageUrl || product.images[0]?.imageUrl || '/placeholder-product.png'
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb and Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/catalog')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Catalog
        </Button>
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-3">
          {category.imageUrl && (
            <Image
              src={category.imageUrl}
              alt={category.name}
              width={40}
              height={40}
              className="rounded object-cover"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
            {category.description && (
              <p className="text-muted-foreground">{category.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Total Products</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Active</p>
                <p className="text-2xl font-bold">{activeProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Low Stock</p>
                <p className="text-2xl font-bold">{lowStockProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-4 w-4 bg-primary rounded-full" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Featured</p>
                <p className="text-2xl font-bold">{featuredProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Products in {category.name}</CardTitle>
            <Button asChild>
              <Link href={`/admin/catalog/${category.id}/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            )}
          </div>

          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="group hover:shadow-lg transition-all duration-200 h-full flex flex-col">
                  <CardContent className="p-5 flex flex-col h-full">
                    <div className="space-y-3 flex-1 flex flex-col">
                      {/* Product Image */}
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <Image
                          src={getPrimaryImage(product)}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        {!product.isActive && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Badge variant="secondary" className="text-xs">Inactive</Badge>
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="space-y-2 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors mb-2">
                            {product.name}
                          </h3>
                          
                          {product.sku && (
                            <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-base">₹{product.price.toLocaleString()}</div>
                              {product.compareAtPrice && (
                                <div className="text-sm text-muted-foreground line-through">
                                  ₹{product.compareAtPrice.toLocaleString()}
                                </div>
                              )}
                            </div>
                            <div className={`text-sm ${product.stockQuantity <= 10 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                              Stock: {product.stockQuantity}
                            </div>
                          </div>

                          {/* Categories */}
                          <div className="flex flex-wrap gap-1">
                            {product.categories.map((cat, index) => (
                              <Badge 
                                key={cat.id} 
                                variant={cat.isPrimary ? "default" : "outline"}
                                className="text-sm px-2 py-1"
                              >
                                {cat.name}
                                {cat.isPrimary && <span className="ml-1">★</span>}
                              </Badge>
                            ))}
                          </div>

                          {/* Status Badges */}
                          {product.isFeatured && (
                            <div className="flex gap-1">
                              <Badge variant="outline" className="text-sm px-2 py-1">Featured</Badge>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 pt-2 flex-shrink-0">
                          <Button size="sm" variant="ghost" asChild className="flex-1 text-sm px-3 py-2">
                            <Link href={`/products/${product.slug}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Link>
                          </Button>
                          <Button size="sm" variant="ghost" asChild className="flex-1 text-sm px-3 py-2">
                            <Link href={`/admin/products/${product.id}/edit`}>
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Link>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDelete(product.id)}
                            disabled={isLoading}
                            className="text-destructive hover:text-destructive text-sm px-3 py-2"
                            title={isAdmin ? "Delete product" : "Request deletion"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              {searchQuery ? (
                <>
                  <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No products found</h3>
                  <p className="text-muted-foreground mb-4">
                    No products match your search query "{searchQuery}"
                  </p>
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </Button>
                </>
              ) : (
                <>
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No products in this category</h3>
                  <p className="text-muted-foreground mb-4">
                    Start adding products to the {category.name} category
                  </p>
                  <Button asChild>
                    <Link href={`/admin/catalog/${category.id}/new`}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Product
                    </Link>
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Search Results Info */}
          {searchQuery && filteredProducts.length > 0 && (
            <div className="text-sm text-muted-foreground text-center mt-6">
              Showing {filteredProducts.length} of {products.length} products
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Single Product Deletion Ticket Modal */}
      <DeletionTicketModal
        isOpen={deletionTicketOpen}
        onClose={() => setDeletionTicketOpen(false)}
        type="product"
        itemId={ticketProductId || ''}
        itemName={ticketProductName}
        onTicketCreated={() => {
          toast.success('Deletion request submitted successfully!')
        }}
      />
    </div>
  )
}