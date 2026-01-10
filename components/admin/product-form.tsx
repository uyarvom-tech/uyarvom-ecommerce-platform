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
import { ArrowLeft, Palette, Plus, X } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { MultiImageManager } from "@/components/admin/multi-image-manager"
import ColorVariantImageManager from "@/components/admin/color-variant-image-manager"

interface Category {
  id: string
  name: string
  slug: string
  parentId: string | null
  children?: Category[]
}

interface ProductFormProps {
  categories: Category[]
  product?: any // For edit mode
  defaultCategoryId?: string // For setting default category
  redirectPath?: string // Custom redirect path after creation/update
}

interface ProductImage {
  id?: string
  imageUrl: string
  altText: string
  isPrimary: boolean
  sortOrder?: number
}

export function ProductForm({ categories, product, defaultCategoryId, redirectPath }: ProductFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  
  // Get URL parameters for pre-selecting categories
  const mainCategoryParam = searchParams.get('mainCategory')
  const subCategoryParam = searchParams.get('subCategory')
  
  const [formData, setFormData] = useState({
    name: product?.name || '',
    slug: product?.slug || '',
    description: product?.description || '',
    shortDescription: product?.shortDescription || '',
    price: product?.price || '',
    compareAtPrice: product?.compareAtPrice || '',
    stockQuantity: product?.stockQuantity || '',
    lowStockThreshold: product?.lowStockThreshold || '10',
    sku: product?.sku || '',
    weight: product?.weight || '',
    mainCategoryId: product?.mainCategoryId || mainCategoryParam || defaultCategoryId || '',
    subCategoryId: product?.subCategoryId || subCategoryParam || '',
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false
  })

  const [images, setImages] = useState<ProductImage[]>(
    // Only show regular images if the product doesn't have color variants
    (!product?.hasColorVariants && product?.images) ? 
      product.images.map((img: any, index: number) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        altText: img.altText || '',
        isPrimary: img.isPrimary,
        sortOrder: img.sortOrder || index
      })) : []
  )

  const [hasColorVariants, setHasColorVariants] = useState(product?.hasColorVariants || false)
  const [colorVariants, setColorVariants] = useState<any[]>(product?.colorVariants || [])

  // Organize categories into main and sub categories
  const mainCategories = categories.filter(cat => !cat.parentId)
  const subCategoriesByParent = categories
    .filter(cat => cat.parentId)
    .reduce((acc, cat) => {
      if (!acc[cat.parentId!]) acc[cat.parentId!] = []
      acc[cat.parentId!].push(cat)
      return acc
    }, {} as Record<string, Category[]>)

  // Get available sub-categories for selected main category
  const availableSubCategories = formData.mainCategoryId 
    ? subCategoriesByParent[formData.mainCategoryId] || []
    : []

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // If main category changes, reset sub-category
      if (field === 'mainCategoryId') {
        newData.subCategoryId = ''
      }
      
      // Auto-generate slug from name
      if (field === 'name' && !product) {
        const slug = value.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
        
        // Auto-generate SKU from name if SKU is empty
        const sku = !prev.sku ? `UYV-${value.toLowerCase().replace(/[^a-z0-9]+/g, '').substring(0, 6).toUpperCase()}-${Date.now().toString().slice(-3)}` : prev.sku
        
        setFormData(prevData => ({ ...prevData, slug, sku }))
        return newData
      }
      
      return newData
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    console.log('🚀 FORM SUBMISSION STARTED')
    console.log('📋 Form Data:', formData)
    console.log('🖼️ Images State:', images)

    try {
      // Validate required fields
      if (!formData.name || !formData.slug || !formData.price || !formData.mainCategoryId || !formData.subCategoryId) {
        throw new Error('Please fill in all required fields including main category and sub-category')
      }

      // Validate that we have images (either regular or color variants)
      let validImages: any[] = []
      
      if (!hasColorVariants) {
        validImages = images.filter(img => img.imageUrl && img.imageUrl.trim() !== '')
        console.log('✅ Valid Images (non-empty URLs):', validImages)
        
        if (validImages.length === 0) {
          throw new Error('Please upload at least one product image')
        }
        
        // Ensure at least one image is marked as primary
        const hasPrimary = validImages.some(img => img.isPrimary)
        console.log('⭐ Has Primary Image:', hasPrimary)
        if (!hasPrimary) {
          validImages[0].isPrimary = true
          console.log('🔧 Auto-set first image as primary')
        }
      } else {
        // Validate color variants
        if (colorVariants.length === 0) {
          throw new Error('Please add at least one color variant')
        }
        
        const hasImagesInVariants = colorVariants.some(variant => variant.images && variant.images.length > 0)
        if (!hasImagesInVariants) {
          throw new Error('Please upload images for at least one color variant')
        }
      }

      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
        stockQuantity: parseInt(formData.stockQuantity),
        lowStockThreshold: parseInt(formData.lowStockThreshold),
        weight: formData.weight ? parseFloat(formData.weight) : null,
        images: hasColorVariants ? [] : validImages, // Use regular images only if no color variants
        hasColorVariants: hasColorVariants,
        colorVariants: hasColorVariants ? colorVariants : []
      }

      console.log('📦 Final Product Data to Send:', productData)
      console.log('🎨 Color Variants to Send:', productData.colorVariants)
      console.log('🖼️ Images in Product Data:', productData.images)

      const url = '/api/admin/products'
      const method = product ? 'PUT' : 'POST'
      const body = product ? { ...productData, id: product.id } : productData

      console.log(`🌐 API Request: ${method} ${url}`)
      console.log('📤 Request Body:', body)

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      console.log('📡 Response Status:', response.status)
      console.log('📡 Response OK:', response.ok)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ API Error Response:', errorData)
        throw new Error(errorData.error || 'Failed to save product')
      }

      const result = await response.json()
      console.log('✅ API Success Response:', result)
      console.log('🖼️ Saved Product Images:', result.images)
      
      if (product) {
        toast.success('Product updated successfully!')
        router.push(redirectPath || '/admin/products')
      } else {
        toast.success('Product created successfully!')
        
        // If color variants were enabled, redirect to edit mode to add them
        if (hasColorVariants) {
          toast.success('Redirecting to add color variants...', { duration: 2000 })
          setTimeout(() => {
            router.push(`/admin/products/${result.id}/edit`)
          }, 1500)
        } else {
          router.push(redirectPath || '/admin/products')
        }
      }
    } catch (error: any) {
      console.error('💥 FORM SUBMISSION ERROR:', error)
      toast.error(error.message || 'Failed to save product. Please try again.')
    } finally {
      setIsLoading(false)
      console.log('🏁 FORM SUBMISSION ENDED')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Product Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="product-url-slug"
                  required
                />
              </div>

              <div>
                <Label htmlFor="shortDescription">Short Description</Label>
                <Input
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                  placeholder="Brief product description"
                />
              </div>

              <div>
                <Label htmlFor="description">Full Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Detailed product description"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Product Images */}
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
              <p className="text-sm text-muted-foreground">
                {hasColorVariants 
                  ? "Color variant images are managed below. You can still add general product images here."
                  : "Upload multiple high-quality images. Drag to reorder. First image is the main product image."
                }
              </p>
            </CardHeader>
            <CardContent>
              {!hasColorVariants ? (
                // Default image upload
                <div className="space-y-4">
                  <MultiImageManager 
                    images={images} 
                    onImagesChange={setImages} 
                    productId={product?.id}
                    maxImages={10}
                  />
                  
                  <div className="text-center pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        // Automatically add first color variant when switching
                        const firstVariant = {
                          id: `color-${Date.now()}`,
                          colorName: '',
                          colorCode: '#000000',
                          images: []
                        }
                        setHasColorVariants(true)
                        setColorVariants([firstVariant])
                      }}
                      className="flex items-center gap-2"
                    >
                      <Palette className="h-4 w-4" />
                      Upload Multiple Color Variants Instead
                    </Button>
                    <p className="text-xs text-gray-600 mt-2">
                      Switch to color variant mode if your product comes in different colors
                    </p>
                  </div>
                </div>
              ) : (
                // Color variant mode
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
                    <div>
                      <h4 className="font-medium text-blue-900">Color Variant Mode Active</h4>
                      <p className="text-sm text-blue-700">
                        Upload images for each color variant below
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setHasColorVariants(false)
                        setColorVariants([])
                      }}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Switch to Simple Images
                    </Button>
                  </div>
                  
                  <ColorVariantImageManager
                    onVariantsChange={setColorVariants}
                    initialVariants={colorVariants}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Variants - Remove the old section */}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="compareAtPrice">Compare at Price (₹)</Label>
                <Input
                  id="compareAtPrice"
                  type="number"
                  step="0.01"
                  value={formData.compareAtPrice}
                  onChange={(e) => handleInputChange('compareAtPrice', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="stockQuantity">Stock Quantity *</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  value={formData.stockQuantity}
                  onChange={(e) => handleInputChange('stockQuantity', e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  value={formData.lowStockThreshold}
                  onChange={(e) => handleInputChange('lowStockThreshold', e.target.value)}
                  placeholder="10"
                />
              </div>
              <div>
                <Label htmlFor="sku">SKU (Optional)</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  placeholder="Auto-generated if empty"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to auto-generate from product name
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Organization */}
          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="mainCategory">Main Category *</Label>
                  <Select 
                    value={formData.mainCategoryId} 
                    onValueChange={(value) => handleInputChange('mainCategoryId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select main category" />
                    </SelectTrigger>
                    <SelectContent>
                      {mainCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Choose the primary category for this product
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="subCategory">Sub-Category *</Label>
                  <Select 
                    value={formData.subCategoryId} 
                    onValueChange={(value) => handleInputChange('subCategoryId', value)}
                    disabled={!formData.mainCategoryId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !formData.mainCategoryId 
                          ? "Select main category first" 
                          : availableSubCategories.length === 0
                            ? "No sub-categories available"
                            : "Select sub-category"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {!formData.mainCategoryId 
                      ? "Select a main category first"
                      : availableSubCategories.length === 0
                        ? "No sub-categories available for this main category"
                        : "Choose the specific sub-category for this product"
                    }
                  </p>
                </div>
              </div>
              
              {/* Category Hierarchy Display */}
              {formData.mainCategoryId && formData.subCategoryId && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 mb-1">Product Category Path:</p>
                  <p className="text-sm text-blue-700">
                    {mainCategories.find(c => c.id === formData.mainCategoryId)?.name} 
                    {' → '}
                    {availableSubCategories.find(c => c.id === formData.subCategoryId)?.name}
                  </p>
                </div>
              )}
              
              <div>
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => handleInputChange('isFeatured', checked)}
                />
                <Label htmlFor="isFeatured">Featured</Label>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/products">Cancel</Link>
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  )
}