'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Package,
  TrendingUp,
  AlertTriangle
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
  categories?: Array<{
    id: string
    name: string
  }>
  primaryCategory?: {
    id: string
    name: string
  }
  category?: {
    id: string
    name: string
  }
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
}

interface ProductManagementProps {
  initialProducts: Product[]
  categories: Category[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export function ProductManagement({ initialProducts, categories, pagination }: ProductManagementProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [allProducts, setAllProducts] = useState<Product[]>(initialProducts) // Store all products
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(initialProducts) // Display filtered products
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  
  // Filter states - don't use URL params for initial state to avoid conflicts
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Real-time filtering function
  const applyFilters = () => {
    let filtered = [...allProducts]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query) ||
        product.categories?.some(cat => cat.name.toLowerCase().includes(query))
      )
    }

    // Apply category filter - only filter if not 'all'
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(product => {
        // Check if product has categories array
        if (product.categories && product.categories.length > 0) {
          return product.categories.some(cat => cat.id === categoryFilter)
        }
        // Fallback to single category field
        return product.category?.id === categoryFilter
      })
    }

    // Apply status filter - only filter if not 'all'
    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(product => product.isActive === true)
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(product => product.isActive === false)
      }
    }

    setFilteredProducts(filtered)
  }

  // Apply filters whenever filter values change
  useEffect(() => {
    console.log('Applying filters:', { searchQuery, categoryFilter, statusFilter, allProductsCount: allProducts.length })
    applyFilters()
  }, [searchQuery, categoryFilter, statusFilter, allProducts])

  // Update products state and maintain filters
  const updateProductsState = (updatedProducts: Product[]) => {
    setAllProducts(updatedProducts)
    // Filtering will be applied automatically by useEffect
  }

  // Stats based on filtered products
  const totalProducts = filteredProducts.length
  const activeProducts = filteredProducts.filter(p => p.isActive).length
  const lowStockProducts = filteredProducts.filter(p => p.stockQuantity <= 10).length
  const featuredProducts = filteredProducts.filter(p => p.isFeatured).length

  // Handle search input with debouncing for better performance
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
  }

  // Handle category filter change - instant filtering
  const handleCategoryChange = (value: string) => {
    console.log('Category changed to:', value)
    setCategoryFilter(value)
  }

  // Handle status filter change - instant filtering
  const handleStatusChange = (value: string) => {
    console.log('Status changed to:', value)
    setStatusFilter(value)
  }

  const clearFilters = () => {
    console.log('Clearing all filters')
    setSearchQuery('')
    setCategoryFilter('all')
    setStatusFilter('all')
    // Force immediate update
    setTimeout(() => {
      setFilteredProducts([...allProducts])
    }, 0)
  }

  // Handle bulk operations
  const handleBulkAction = async (action: string) => {
    if (selectedProducts.length === 0) {
      toast.error('Please select products first')
      return
    }

    if (action === 'delete') {
      setBulkDeleteDialogOpen(true)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          productIds: selectedProducts
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to perform bulk action')
      }

      const result = await response.json()
      toast.success(result.message)
      setSelectedProducts([])
      
      // Update products state based on action
      if (action === 'activate') {
        const updatedProducts = allProducts.map(p => 
          selectedProducts.includes(p.id) ? { ...p, isActive: true } : p
        )
        updateProductsState(updatedProducts)
      } else if (action === 'deactivate') {
        const updatedProducts = allProducts.map(p => 
          selectedProducts.includes(p.id) ? { ...p, isActive: false } : p
        )
        updateProductsState(updatedProducts)
      } else if (action === 'feature') {
        const updatedProducts = allProducts.map(p => 
          selectedProducts.includes(p.id) ? { ...p, isFeatured: true } : p
        )
        updateProductsState(updatedProducts)
      } else if (action === 'unfeature') {
        const updatedProducts = allProducts.map(p => 
          selectedProducts.includes(p.id) ? { ...p, isFeatured: false } : p
        )
        updateProductsState(updatedProducts)
      }
    } catch (error: any) {
      console.error('Bulk action error:', error)
      toast.error(error.message || 'Failed to perform bulk action')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle bulk delete confirmation
  const handleBulkDeleteConfirm = async () => {
    setIsLoading(true)
    setBulkDeleteDialogOpen(false)
    
    try {
      const response = await fetch('/api/admin/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          productIds: selectedProducts
        })
      })

      if (!response.ok) {
        let errorMessage = 'Failed to delete products'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      toast.success(result.message)
      
      // Remove deleted products from state
      const updatedProducts = allProducts.filter(p => !selectedProducts.includes(p.id))
      updateProductsState(updatedProducts)
      setSelectedProducts([])
    } catch (error: any) {
      console.error('Bulk delete error:', error)
      toast.error(error.message || 'Failed to delete products')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle single product delete
  const handleDelete = (productId: string) => {
    setProductToDelete(productId)
    setDeleteDialogOpen(true)
  }

  // Handle single delete confirmation
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
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      // Try to parse JSON response, but don't fail if it's empty
      try {
        await response.json()
      } catch {
        // Ignore JSON parsing errors for successful responses
      }

      toast.success('Product deleted successfully')
      
      // Remove deleted product from state
      const updatedProducts = allProducts.filter(p => p.id !== productToDelete)
      updateProductsState(updatedProducts)
      setProductToDelete(null)
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(error.message || 'Failed to delete product')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const toggleSelectAll = () => {
    setSelectedProducts(
      selectedProducts.length === filteredProducts.length 
        ? [] 
        : filteredProducts.map(p => p.id)
    )
  }

  const getPrimaryImage = (product: Product) => {
    const primaryImage = product.images.find(img => img.isPrimary)
    return primaryImage?.imageUrl || product.images[0]?.imageUrl || '/placeholder-product.png'
  }

  return (
    <div className="space-y-6">
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

      {/* Actions and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Products</CardTitle>
            <Button asChild>
              <Link href="/admin/products/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories">
                    {categoryFilter === 'all' ? 'All Categories' : categories.find(c => c.id === categoryFilter)?.name || 'All Categories'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Status">
                    {statusFilter === 'all' ? 'All Status' : statusFilter === 'active' ? 'Active' : statusFilter === 'inactive' ? 'Inactive' : 'All Status'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              {(searchQuery || (categoryFilter && categoryFilter !== 'all') || (statusFilter && statusFilter !== 'all')) && (
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedProducts.length > 0 && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">
                {selectedProducts.length} selected
              </span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleBulkAction('activate')}
                disabled={isLoading}
              >
                Activate
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleBulkAction('deactivate')}
                disabled={isLoading}
              >
                Deactivate
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleBulkAction('feature')}
                disabled={isLoading}
              >
                Feature
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => handleBulkAction('delete')}
                disabled={isLoading}
              >
                Delete
              </Button>
            </div>
          )}

          {/* Products Table */}
          <div className="border rounded-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left">
                      <Checkbox
                        checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="p-3 text-left">Product</th>
                    <th className="p-3 text-left">Category</th>
                    <th className="p-3 text-left">Price</th>
                    <th className="p-3 text-left">Stock</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => toggleProductSelection(product.id)}
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted">
                            <Image
                              src={getPrimaryImage(product)}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {product.sku && `SKU: ${product.sku}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {product.categories?.map((category: any, index: number) => (
                            <Badge 
                              key={category.id} 
                              variant={index === 0 ? "default" : "outline"}
                              className="text-xs"
                            >
                              {category.name}
                              {index === 0 && (
                                <span className="ml-1 text-xs opacity-70">★</span>
                              )}
                            </Badge>
                          )) || (
                            <Badge variant="outline" className="text-xs">
                              {product.category?.name || 'No Category'}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">₹{product.price.toLocaleString()}</div>
                        {product.compareAtPrice && (
                          <div className="text-sm text-muted-foreground line-through">
                            ₹{product.compareAtPrice.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className={`font-medium ${product.stockQuantity <= 10 ? 'text-orange-600' : ''}`}>
                          {product.stockQuantity}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Badge variant={product.isActive ? "default" : "secondary"}>
                            {product.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {product.isFeatured && (
                            <Badge variant="outline">Featured</Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/products/${product.slug}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/admin/products/${product.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDelete(product.id)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Results Info */}
          {filteredProducts.length === 0 && allProducts.length > 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No products match your current filters. <Button variant="link" onClick={clearFilters} className="p-0 h-auto">Clear filters</Button> to see all products.
            </div>
          )}
          
          {filteredProducts.length === 0 && allProducts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No products found. <Button asChild><Link href="/admin/products/new">Add your first product</Link></Button>
            </div>
          )}

          {/* Show filter results info */}
          {(searchQuery || categoryFilter !== 'all' || statusFilter !== 'all') && filteredProducts.length > 0 && (
            <div className="text-sm text-muted-foreground mt-4">
              Showing {filteredProducts.length} of {allProducts.length} products
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
              </div>
              <div className="flex gap-2">
                {pagination.page > 1 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/products?page=${pagination.page - 1}`}>
                      Previous
                    </Link>
                  </Button>
                )}
                {pagination.page < pagination.pages && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/products?page=${pagination.page + 1}`}>
                      Next
                    </Link>
                  </Button>
                )}
              </div>
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

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Products</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedProducts.length} selected products? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedProducts.length} Products
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}