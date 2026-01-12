'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, Edit, Plus, Save, X } from 'lucide-react'
import { toast } from 'sonner'

interface ProductVariant {
  id: string
  name: string
  value: string
  price: number | null
  stock: number
  sku: string | null
  isActive: boolean
  sortOrder: number
}

interface VariantManagementProps {
  productId: string
  productPrice: number
}

export default function VariantManagement({ productId, productPrice }: VariantManagementProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    price: '',
    stock: '0',
    sku: '',
    sortOrder: '0'
  })

  useEffect(() => {
    fetchVariants()
  }, [productId])

  const fetchVariants = async () => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/variants`)
      if (response.ok) {
        const data = await response.json()
        // Exclude color variants as they are handled by ColorVariantManager
        const nonColorVariants = data.filter((variant: ProductVariant) => 
          variant.name.toLowerCase() !== 'color'
        )
        setVariants(nonColorVariants)
      }
    } catch (error) {
      console.error('Error fetching variants:', error)
      toast.error('Failed to load variants')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.value.trim()) {
      toast.error('Name and value are required')
      return
    }

    // Prevent creating color variants in this component
    if (formData.name.toLowerCase() === 'color') {
      toast.error('Color variants should be managed using the Color Variants section above')
      return
    }

    try {
      const url = editingId 
        ? `/api/admin/products/${productId}/variants/${editingId}`
        : `/api/admin/products/${productId}/variants`
      
      const method = editingId ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          value: formData.value.trim(),
          price: formData.price ? parseFloat(formData.price) : null,
          stock: parseInt(formData.stock) || 0,
          sku: formData.sku.trim() || null,
          sortOrder: parseInt(formData.sortOrder) || 0
        })
      })

      if (response.ok) {
        toast.success(editingId ? 'Variant updated successfully' : 'Variant created successfully')
        await fetchVariants()
        resetForm()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save variant')
      }
    } catch (error) {
      console.error('Error saving variant:', error)
      toast.error('Failed to save variant')
    }
  }

  const handleEdit = (variant: ProductVariant) => {
    setEditingId(variant.id)
    setFormData({
      name: variant.name,
      value: variant.value,
      price: variant.price?.toString() || '',
      stock: variant.stock.toString(),
      sku: variant.sku || '',
      sortOrder: variant.sortOrder.toString()
    })
    setShowAddForm(true)
  }

  const handleDelete = async (variantId: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/products/${productId}/variants/${variantId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Variant deleted successfully')
        await fetchVariants()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete variant')
      }
    } catch (error) {
      console.error('Error deleting variant:', error)
      toast.error('Failed to delete variant')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      value: '',
      price: '',
      stock: '0',
      sku: '',
      sortOrder: '0'
    })
    setEditingId(null)
    setShowAddForm(false)
  }

  const groupedVariants = variants.reduce((acc, variant) => {
    if (!acc[variant.name]) {
      acc[variant.name] = []
    }
    acc[variant.name].push(variant)
    return acc
  }, {} as Record<string, ProductVariant[]>)

  if (loading) {
    return <div className="p-4">Loading variants...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Product Variants</h3>
        <Button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setShowAddForm(true)
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Variant
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Variant' : 'Add New Variant'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Variant Type</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Size, Material"
                  />
                </div>
                <div>
                  <Label htmlFor="value">Variant Value</Label>
                  <Input
                    id="value"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder="e.g., Large, Ceramic"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Price Override</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder={`Base: ₹${productPrice}`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to use base price (₹{productPrice})
                  </p>
                </div>
                <div>
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="sku">SKU (Optional)</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Unique identifier"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  type="button" 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleSubmit()
                  }}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {editingId ? 'Update Variant' : 'Create Variant'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    resetForm()
                  }}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Variants List */}
      {Object.keys(groupedVariants).length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            No non-color variants created yet. Add variants like sizes, materials, or other options (colors are managed separately above).
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedVariants).map(([variantName, variantList]) => (
            <Card key={variantName}>
              <CardHeader>
                <CardTitle className="text-base">{variantName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {variantList.map((variant) => (
                    <div
                      key={variant.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary">{variant.value}</Badge>
                        <div className="text-sm">
                          <span className="font-medium">
                            ₹{variant.price || productPrice}
                          </span>
                          {variant.price && (
                            <span className="text-gray-500 ml-2">
                              (Override: +₹{variant.price - productPrice})
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          Stock: {variant.stock}
                        </div>
                        {variant.sku && (
                          <div className="text-xs text-gray-500">
                            SKU: {variant.sku}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleEdit(variant)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleDelete(variant.id)
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
