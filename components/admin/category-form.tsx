'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"

interface MainCategory {
  id: string
  name: string
  slug: string
}

interface CategoryFormProps {
  mainCategories: MainCategory[]
  category?: any // For edit mode
  defaultParentId?: string // For pre-selecting parent when creating sub-categories
}

export function CategoryForm({ mainCategories, category, defaultParentId }: CategoryFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const parentId = searchParams.get('parentId') // For creating sub-categories
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    imageUrl: category?.imageUrl || '',
    displayOrder: category?.displayOrder || 0,
    isActive: category?.isActive ?? true,
    parentId: category?.parentId || defaultParentId || parentId || null
  })

  const isEdit = !!category
  const isSubCategory = !!formData.parentId || !!defaultParentId
  const selectedParent = mainCategories.find(cat => cat.id === (formData.parentId || defaultParentId))

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Auto-generate slug from name
      if (field === 'name' && !isEdit) {
        const slug = value.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
        
        newData.slug = slug
      }
      
      return newData
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate form data
      if (!formData.name || !formData.slug) {
        throw new Error('Name and slug are required')
      }

      const url = '/api/admin/categories'
      const method = isEdit ? 'PUT' : 'POST'
      
      const body = isEdit 
        ? { ...formData, id: category.id }
        : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save category')
      }

      toast.success(isEdit ? 'Category updated successfully!' : 'Category created successfully!')
      
      // Navigate back to appropriate page
      if (isSubCategory && !isEdit) {
        router.push(`/admin/catalog/${formData.parentId}`)
      } else if (isEdit && formData.parentId) {
        router.push(`/admin/catalog/${formData.parentId}`)
      } else {
        router.push('/admin/catalog')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save category')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (isSubCategory && !isEdit) {
      router.push(`/admin/catalog/${formData.parentId}`)
    } else if (isEdit && formData.parentId) {
      router.push(`/admin/catalog/${formData.parentId}`)
    } else {
      router.push('/admin/catalog')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="p-1"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">
            {isEdit 
              ? `Edit ${isSubCategory ? 'Sub-Category' : 'Category'}` 
              : `Create ${isSubCategory ? 'Sub-Category' : 'Category'}`
            }
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEdit 
              ? 'Update category details and settings'
              : isSubCategory 
                ? `Add a new sub-category under "${selectedParent?.name}"`
                : 'Add a new main category to organize your products'
            }
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Category Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Parent Category Selection (only for new categories) */}
            {!isEdit && !defaultParentId && (
              <div>
                <Label htmlFor="categoryType">Category Type</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="mainCategory"
                      name="categoryType"
                      checked={!formData.parentId}
                      onChange={() => handleInputChange('parentId', null)}
                    />
                    <Label htmlFor="mainCategory">Main Category</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="subCategory"
                      name="categoryType"
                      checked={!!formData.parentId}
                      onChange={() => {
                        // Set first main category as default when switching to sub-category
                        if (mainCategories.length > 0) {
                          handleInputChange('parentId', mainCategories[0].id)
                        }
                      }}
                    />
                    <Label htmlFor="subCategory">Sub-Category</Label>
                  </div>
                  
                  {/* Parent Category Dropdown */}
                  {formData.parentId && (
                    <div className="ml-6">
                      <Label htmlFor="parentSelect">Parent Category *</Label>
                      <Select 
                        value={formData.parentId} 
                        onValueChange={(value) => handleInputChange('parentId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent category" />
                        </SelectTrigger>
                        <SelectContent>
                          {mainCategories.map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Choose which main category this sub-category belongs to
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Show parent info when defaultParentId is provided (creating sub-category) */}
            {!isEdit && defaultParentId && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  Creating sub-category under: {selectedParent?.name}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  This will be created as a sub-category of "{selectedParent?.name}"
                </p>
              </div>
            )}

            {/* Show parent info for editing sub-categories */}
            {isEdit && formData.parentId && selectedParent && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  Sub-category of: {selectedParent.name}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  To change the parent category, you need to create a new category
                </p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter category name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="category-url-slug"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => handleInputChange('displayOrder', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">Lower numbers appear first</p>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe what products belong in this category..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">This helps customers understand what they'll find in this category</p>
            </div>
            
            <div>
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-xs text-muted-foreground mt-1">Optional category image</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange('isActive', !!checked)}
              />
              <Label htmlFor="isActive">Active</Label>
              <p className="text-xs text-muted-foreground ml-2">Inactive categories won't be visible to customers</p>
            </div>
            
            <div className="flex gap-2 pt-4 border-t">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : (isEdit ? 'Update Category' : 'Create Category')}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
