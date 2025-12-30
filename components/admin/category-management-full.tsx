'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  FolderOpen,
  Folder,
  Package,
  ArrowUp,
  ArrowDown
} from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { CategoryImageUpload } from "@/components/admin/category-image-upload"

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  imageUrl?: string
  displayOrder: number
  parentId?: string
  isActive: boolean
  children?: Category[]
  _count?: {
    productCategories: number
    children: number
  }
}

interface CategoryFormData {
  name: string
  slug: string
  description: string
  imageUrl: string
  parentId: string
  displayOrder: number
  isActive: boolean
}

export function CategoryManagementFull() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    parentId: '',
    displayOrder: 0,
    isActive: true
  })

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to fetch categories')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    
    setFormData(prev => ({ ...prev, name, slug }))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = '/api/admin/categories'
      const method = editingCategory ? 'PUT' : 'POST'
      
      // Convert "no-parent" back to null for API
      const submitData = {
        ...formData,
        parentId: formData.parentId === '' ? null : formData.parentId
      }
      
      const body = editingCategory 
        ? { ...submitData, id: editingCategory.id }
        : submitData

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
      
      // Reset form and refresh data
      setFormData({
        name: '',
        slug: '',
        description: '',
        imageUrl: '',
        parentId: '',
        displayOrder: 0,
        isActive: true
      })
      setEditingCategory(null)
      setShowForm(false)
      fetchCategories()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save category')
    }
  }

  // Handle edit
  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      parentId: category.parentId || '',
      displayOrder: category.displayOrder,
      isActive: category.isActive
    })
    setEditingCategory(category)
    setShowForm(true)
  }

  // Handle delete
  const handleDelete = (category: Category) => {
    setCategoryToDelete(category)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return

    try {
      const response = await fetch(`/api/admin/categories/${categoryToDelete.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete category')
      }

      toast.success('Category deleted successfully!')
      fetchCategories()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete category')
    } finally {
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
    }
  }

  // Get flat list of categories for parent selection
  const getFlatCategories = (cats: Category[], level = 0): Array<Category & { level: number }> => {
    let result: Array<Category & { level: number }> = []
    
    for (const cat of cats) {
      result.push({ ...cat, level })
      if (cat.children && cat.children.length > 0) {
        result = result.concat(getFlatCategories(cat.children, level + 1))
      }
    }
    
    return result
  }

  const flatCategories = getFlatCategories(categories)

  // Render category tree
  const renderCategoryTree = (cats: Category[], level = 0) => {
    return cats.map((category) => (
      <div key={category.id} className="border rounded-lg mb-2">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3" style={{ marginLeft: level * 20 }}>
            {category.children && category.children.length > 0 ? (
              <FolderOpen className="h-5 w-5 text-amber-500" />
            ) : (
              <Folder className="h-5 w-5 text-gray-400" />
            )}
            
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
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{category.name}</h3>
                {!category.isActive && (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {category._count?.productCategories || 0} products • 
                {category._count?.children || 0} subcategories
              </p>
              {category.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {category.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Order: {category.displayOrder}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(category)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(category)}
              disabled={category._count?.children > 0 || category._count?.productCategories > 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {category.children && category.children.length > 0 && (
          <div className="border-t bg-muted/30 p-2">
            {renderCategoryTree(category.children, level + 1)}
          </div>
        )}
      </div>
    ))
  }

  if (isLoading) {
    return <div className="p-6">Loading categories...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Category Management</h2>
          <p className="text-muted-foreground">
            Organize your products with hierarchical categories
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Categories</p>
                <p className="text-2xl font-bold">{flatCategories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-medium">Root Categories</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">With Products</p>
                <p className="text-2xl font-bold">
                  {flatCategories.filter(c => c._count?.productCategories > 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <X className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium">Inactive</p>
                <p className="text-2xl font-bold">
                  {flatCategories.filter(c => !c.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Enter category name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="category-url-slug"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="parent">Parent Category</Label>
                  <Select 
                    value={formData.parentId || "no-parent"} 
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      parentId: value === "no-parent" ? "" : value 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-parent">No Parent (Root Category)</SelectItem>
                      {flatCategories
                        .filter(cat => cat.id !== editingCategory?.id) // Prevent self-parent
                        .map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {'  '.repeat(category.level)}
                            {category.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="displayOrder">Display Order</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Category description (optional)"
                  rows={3}
                />
              </div>
              
              <div className="col-span-2">
                <CategoryImageUpload
                  imageUrl={formData.imageUrl}
                  onImageChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
                  categoryName={formData.name || 'New Category'}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: !!checked }))}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false)
                    setEditingCategory(null)
                    setFormData({
                      name: '',
                      slug: '',
                      description: '',
                      imageUrl: '',
                      parentId: '',
                      displayOrder: 0,
                      isActive: true
                    })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Category Tree */}
      <Card>
        <CardHeader>
          <CardTitle>Category Hierarchy</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage your category structure. Categories with products or subcategories cannot be deleted.
          </p>
        </CardHeader>
        <CardContent>
          {categories.length > 0 ? (
            <div className="space-y-2">
              {renderCategoryTree(categories)}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No categories found. Create your first category to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{categoryToDelete?.name}"? This action cannot be undone.
              {categoryToDelete?._count?.children > 0 && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800">
                  This category has {categoryToDelete._count.children} subcategories. Please delete or move them first.
                </div>
              )}
              {categoryToDelete?._count?.productCategories > 0 && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800">
                  This category has {categoryToDelete._count.productCategories} products. Please move them to other categories first.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={
                (categoryToDelete?._count?.children || 0) > 0 || 
                (categoryToDelete?._count?.productCategories || 0) > 0
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}