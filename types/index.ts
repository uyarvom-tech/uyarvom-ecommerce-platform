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

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  compareAtPrice?: number | null
  sku: string
  isActive: boolean
  images: string[]
  categoryId: string
  subCategoryId?: string | null
  createdAt?: Date
  updatedAt?: Date
}

export interface User {
  id: string
  email: string
  full_name?: string | null
  role?: 'admin' | 'customer' | 'staff'
  phone?: string | null
}