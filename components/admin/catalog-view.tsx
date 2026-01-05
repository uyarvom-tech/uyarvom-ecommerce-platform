'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { CategoryImageUpload } from "@/components/admin/category-image-upload"
import { DeletionTicketModal } from "@/components/admin/deletion-ticket-modal"
import { 
  Search, 
  Plus, 
  Package,
  FolderOpen,
  Folder,
  Edit,
  Trash2,
  BarChart3,
  TrendingUp
} from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  imageUrl?: string
  displayOrder: number
  parentId?: string
  isActive: boolean
  productCount: number
}

interface Product {
  id: string
  name: string
  slug: string
  price: number
  stockQuantity: number
  isActive: boolean
  categories: Array<{
    id: string
    name: string
  }>
  images: Array<{
    imageUrl: string
    isPrimary: boolean
  }>
}

interface SearchResultCategory extends Category {
  matchingProducts: Array<{
    id: string
    name: string
    price: number
  }>
}

interface CatalogViewProps {
  categories: Category[]
  userRole?: string // Add user role prop
}

export function CatalogView({ categories, userRole = 'staff' }: CatalogViewProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showEditCategory, setShowEditCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResultCategory[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [deletionTicketOpen, setDeletionTicketOpen] = useState(false)
  const [ticketCategoryId, setTicketCategoryId] = useState<string | null>(null)
  const [ticketCategoryName, setTicketCategoryName] = useState<string>('')
  
  // Check if user is admin (can delete directly)
  const isAdmin = userRole === 'super_admin'
  
  // Debug logging
  console.log('CatalogView - userRole:', userRole, 'isAdmin:', isAdmin)
  
  // Category form data
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    displayOrder: 0,
    isActive: true
  })

  // Filter categories based on search
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate statistics
  const totalCategories = categories.length
  const activeCategories = categories.filter(c => c.isActive).length
  const totalProducts = categories.reduce((sum, cat) => sum + cat.productCount, 0)
  const categoriesWithProducts = categories.filter(c => c.productCount > 0).length

  // Search categories that contain products matching the query
  useEffect(() => {
    const searchCategoriesWithProducts = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      try {
        const response = await fetch(`/api/admin/categories/search?q=${encodeURIComponent(searchQuery)}`)
        if (response.ok) {
          const data = await response.json()
          setSearchResults(data.categories || [])
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsSearching(false)
      }
    }

    const debounceTimer = setTimeout(searchCategoriesWithProducts, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  // Handle edit category
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      displayOrder: category.displayOrder,
      isActive: category.isActive
    })
    setShowEditCategory(true)
  }

  // Handle delete category
  const handleDeleteCategory = (category: Category) => {
    if (isAdmin) {
      setCategoryToDelete(category)
      setDeleteDialogOpen(true)
    } else {
      // Staff users create deletion ticket
      setTicketCategoryId(category.id)
      setTicketCategoryName(category.name)
      setDeletionTicketOpen(true)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return

    setIsCreating(true)
    try {
      const response = await fetch(`/api/admin/categories/${categoryToDelete.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete category')
      }

      toast.success('Category deleted successfully!')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete category')
    } finally {
      setIsCreating(false)
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
    }
  }

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    
    setCategoryForm(prev => ({ ...prev, name, slug }))
  }

  // Handle category form submission (both create and edit)
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const url = '/api/admin/categories'
      const method = editingCategory ? 'PUT' : 'POST'
      
      const body = editingCategory 
        ? { ...categoryForm, id: editingCategory.id }
        : { ...categoryForm, displayOrder: categories.length }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save category')
      }

      toast.success(editingCategory ? 'Category updated successfully!' : 'Category created successfully!')
      
      // Reset form
      setCategoryForm({
        name: '',
        slug: '',
        description: '',
        imageUrl: '',
        displayOrder: 0,
        isActive: true
      })
      setEditingCategory(null)
      setShowAddCategory(false)
      setShowEditCategory(false)
      
      // Refresh the page
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save category')
    } finally {
      setIsCreating(false)
    }
  }

  // Handle bulk operations
  const handleBulkAction = async (action: string) => {
    if (selectedCategories.length === 0) {
      toast.error('Please select categories first')
      return
    }

    setIsCreating(true)
    try {
      // For now, we'll implement activate/deactivate bulk actions
      if (action === 'activate' || action === 'deactivate') {
        const promises = selectedCategories.map(categoryId => 
          fetch('/api/admin/categories', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: categoryId,
              isActive: action === 'activate'
            })
          })
        )

        await Promise.all(promises)
        toast.success(`Categories ${action}d successfully!`)
        setSelectedCategories([])
        router.refresh()
      }
    } catch (error: any) {
      toast.error(`Failed to ${action} categories`)
    } finally {
      setIsCreating(false)
    }
  }

  // Toggle category selection
  const toggleCategorySelection = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  // Toggle select all
  const toggleSelectAll = () => {
    const visibleCategories = searchQuery ? searchResults : categories
    setSelectedCategories(
      selectedCategories.length === visibleCategories.length 
        ? [] 
        : visibleCategories.map(c => c.id)
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Folder className="h-4 w-4 text-blue-600" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Total Categories</p>
                <p className="text-2xl font-bold">{totalCategories}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Active Categories</p>
                <p className="text-2xl font-bold">{activeCategories}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-4 w-4 text-purple-600" />
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
              <BarChart3 className="h-4 w-4 text-orange-600" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">With Products</p>
                <p className="text-2xl font-bold">{categoriesWithProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Search and Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for products to find their categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button onClick={() => setShowAddCategory(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Category
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowBulkActions(!showBulkActions)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Bulk Actions
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={selectedCategories.length === (searchQuery ? searchResults : categories).length && (searchQuery ? searchResults : categories).length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm font-medium">
                  {selectedCategories.length > 0 
                    ? `${selectedCategories.length} selected` 
                    : 'Select categories for bulk actions'
                  }
                </span>
              </div>
              
              {selectedCategories.length > 0 && (
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleBulkAction('activate')}
                    disabled={isCreating}
                  >
                    Activate
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleBulkAction('deactivate')}
                    disabled={isCreating}
                  >
                    Deactivate
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setSelectedCategories([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Category Form */}
      {(showAddCategory || showEditCategory) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingCategory ? 'Edit Category' : 'Create New Category'}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {editingCategory ? 'Update category details and settings' : 'Add a new category to organize your products'}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCategorySubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    value={categoryForm.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Enter category name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input
                    id="slug"
                    value={categoryForm.slug}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="category-url-slug"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="displayOrder">Display Order</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    value={categoryForm.displayOrder}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Lower numbers appear first</p>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what products belong in this category..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">This helps customers understand what they'll find in this category</p>
              </div>
              
              {/* Image Upload */}
              <CategoryImageUpload
                imageUrl={categoryForm.imageUrl}
                onImageChange={(url) => setCategoryForm(prev => ({ ...prev, imageUrl: url }))}
                categoryName={categoryForm.name || 'New Category'}
              />
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={categoryForm.isActive}
                  onCheckedChange={(checked) => setCategoryForm(prev => ({ ...prev, isActive: !!checked }))}
                />
                <Label htmlFor="isActive">Active</Label>
                <p className="text-xs text-muted-foreground ml-2">Inactive categories won't be visible to customers</p>
              </div>
              
              <div className="flex gap-2 pt-4 border-t">
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Saving...' : (editingCategory ? 'Update Category' : 'Create Category')}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddCategory(false)
                    setShowEditCategory(false)
                    setEditingCategory(null)
                    setCategoryForm({
                      name: '',
                      slug: '',
                      description: '',
                      imageUrl: '',
                      displayOrder: 0,
                      isActive: true
                    })
                  }}
                >
                  Cancel
                </Button>
                {editingCategory && (
                  <Button 
                    type="button" 
                    variant="destructive"
                    onClick={() => handleDeleteCategory(editingCategory)}
                    disabled={editingCategory.productCount > 0}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Category
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search Results or Categories */}
      {searchQuery ? (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Search Results</h2>
            <Badge variant="secondary">{searchResults.length} categories found</Badge>
          </div>
          
          {isSearching ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Searching categories...</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {searchResults.map((category) => (
                <Card 
                  key={category.id} 
                  className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/20 h-full flex flex-col relative"
                  onClick={() => router.push(`/admin/catalog/${category.id}`)}
                >
                  <CardContent className="p-6 flex flex-col h-full">
                    {/* Selection Checkbox */}
                    {showBulkActions && (
                      <div className="absolute top-3 left-3 z-10">
                        <Checkbox
                          checked={selectedCategories.includes(category.id)}
                          onCheckedChange={() => toggleCategorySelection(category.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                    
                    <div className="flex flex-col items-center text-center space-y-4 flex-1">
                      {/* Category Image */}
                      <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                        {category.imageUrl ? (
                          <Image
                            src={category.imageUrl}
                            alt={category.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <FolderOpen className="h-12 w-12 text-muted-foreground" />
                        )}
                      </div>

                      {/* Category Info */}
                      <div className="space-y-3 flex-1 flex flex-col justify-between min-h-0">
                        <div>
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-2 mb-2">
                            {category.name}
                          </h3>
                          
                          {category.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {category.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="flex items-center gap-1 text-sm px-3 py-1">
                              <Package className="h-4 w-4" />
                              {category.productCount} total
                            </Badge>
                            
                            {!category.isActive && (
                              <Badge variant="outline" className="text-sm px-3 py-1">Inactive</Badge>
                            )}
                          </div>

                          {/* Show matching products */}
                          {category.matchingProducts && category.matchingProducts.length > 0 && (
                            <div className="mt-3 p-3 bg-primary/5 rounded-lg">
                              <p className="text-sm font-medium text-primary mb-2">
                                {category.matchingProducts.length} match{category.matchingProducts.length > 1 ? 'es' : ''}:
                              </p>
                              <div className="space-y-1 max-h-20 overflow-y-auto">
                                {category.matchingProducts.slice(0, 2).map((product) => (
                                  <p key={product.id} className="text-sm text-muted-foreground truncate">
                                    • {product.name}
                                  </p>
                                ))}
                                {category.matchingProducts.length > 2 && (
                                  <p className="text-sm text-muted-foreground font-medium">
                                    +{category.matchingProducts.length - 2} more
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity pt-3 flex-shrink-0">
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-sm px-3 py-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/admin/catalog/${category.id}`)
                            }}
                          >
                            <Package className="h-4 w-4 mr-1" />
                            Products
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="text-sm px-2 py-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditCategory(category)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="text-sm px-2 py-1 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteCategory(category)
                            }}
                            disabled={category.productCount > 0}
                            title={isAdmin ? "Delete category" : "Request deletion"}
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
          )}
        </div>
      ) : (
        /* Category Cards Grid */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <Card 
              key={category.id} 
              className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/20 h-full flex flex-col relative"
              onClick={() => router.push(`/admin/catalog/${category.id}`)}
            >
              <CardContent className="p-6 flex flex-col h-full">
                {/* Selection Checkbox */}
                {showBulkActions && (
                  <div className="absolute top-3 left-3 z-10">
                    <Checkbox
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={() => toggleCategorySelection(category.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
                
                <div className="flex flex-col items-center text-center space-y-4 flex-1">
                  {/* Category Image */}
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                    {category.imageUrl ? (
                      <Image
                        src={category.imageUrl}
                        alt={category.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <FolderOpen className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>

                  {/* Category Info */}
                  <div className="space-y-3 flex-1 flex flex-col justify-between min-h-0">
                    <div>
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-2 mb-2">
                        {category.name}
                      </h3>
                      
                      {category.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {category.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="flex items-center gap-1 text-sm px-3 py-1">
                        <Package className="h-4 w-4" />
                        {category.productCount} products
                      </Badge>
                      
                      {!category.isActive && (
                        <Badge variant="outline" className="text-sm px-3 py-1">Inactive</Badge>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity pt-3 flex-shrink-0">
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-sm px-3 py-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/admin/catalog/${category.id}`)
                        }}
                      >
                        <Package className="h-4 w-4 mr-1" />
                        Products
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="text-sm px-2 py-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditCategory(category)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="text-sm px-2 py-1 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteCategory(category)
                        }}
                        disabled={category.productCount > 0}
                        title={isAdmin ? "Delete category" : "Request deletion"}
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
      )}

      {/* Empty States */}
      {!searchQuery && categories.length === 0 && (
        <div className="text-center py-12">
          <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first category to start organizing your products
          </p>
          <Button onClick={() => setShowAddCategory(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Category
          </Button>
        </div>
      )}

      {searchQuery && searchResults.length === 0 && !isSearching && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No categories found</h3>
          <p className="text-muted-foreground mb-4">
            No categories contain products matching "{searchQuery}"
          </p>
          <Button variant="outline" onClick={() => setSearchQuery('')}>
            Clear Search
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{categoryToDelete?.name}"? This action cannot be undone.
              {(categoryToDelete?.productCount || 0) > 0 && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800">
                  This category has {categoryToDelete?.productCount} products. Please move them to other categories first.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={(categoryToDelete?.productCount || 0) > 0}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Category Deletion Ticket Modal */}
      <DeletionTicketModal
        isOpen={deletionTicketOpen}
        onClose={() => setDeletionTicketOpen(false)}
        type="category"
        itemId={ticketCategoryId || ''}
        itemName={ticketCategoryName}
        onTicketCreated={() => {
          toast.success('Deletion request submitted successfully!')
        }}
      />
    </div>
  )
}