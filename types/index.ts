// Shared type definitions to ensure consistency across components

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  parentId?: string | null
  createdAt?: Date
  updatedAt?: Date
}

export interface ProductImage {
  id?: string
  imageUrl?: string
  image_url?: string
  altText?: string
  alt_text?: string
  displayOrder?: number
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  compareAtPrice?: number | null
  compare_at_price?: number | null // Legacy field
  sku: string
  isActive: boolean
  images: ProductImage[]
  categoryId: string
  subCategoryId?: string | null
  stockQuantity?: number
  stock_quantity?: number // Legacy field
  lowStockThreshold?: number
  low_stock_threshold?: number // Legacy field
  createdAt?: Date
  created_at?: string // Legacy field
  updatedAt?: Date
  productCategories?: Array<{
    category: {
      name: string
      slug: string
    }
  }>
}

// Flexible product type for components that receive different data structures
export interface FlexibleProduct {
  id: string
  name: string
  slug?: string
  description?: string | null
  price: number
  compareAtPrice?: number | null
  compare_at_price?: number | null
  sku?: string
  isActive?: boolean
  images?: ProductImage[] | string[]
  categoryId?: string
  subCategoryId?: string | null
  stockQuantity?: number
  stock_quantity?: number
  lowStockThreshold?: number
  low_stock_threshold?: number
  createdAt?: Date | string
  created_at?: string
  updatedAt?: Date | string
  productCategories?: Array<{
    category: {
      name: string
      slug: string
    }
  }>
  category?: {
    name: string
    slug: string
  }
  short_description?: string | null
}

export interface User {
  id: string
  email: string
  full_name?: string | null
  role?: 'admin' | 'customer' | 'staff'
  phone?: string | null
}