'use client'

import { AdminAwareLink } from "@/components/admin-aware-link"
import { CategoriesDropdown } from "@/components/categories-dropdown"
import type { Category } from "@/types"

interface AdminAwareNavigationProductsProps {
  categories: Category[]
}

export function AdminAwareNavigationProducts({ categories }: AdminAwareNavigationProductsProps) {
  return (
    <nav className="hidden items-center gap-8 md:flex flex-1 justify-center">
      <AdminAwareLink href="/" className="premium-nav-link">
        Home
      </AdminAwareLink>
      <AdminAwareLink href="/products" className="premium-nav-link font-semibold">
        Store
      </AdminAwareLink>
      <CategoriesDropdown categories={categories} />
      <AdminAwareLink href="/products?tab=ai-match" className="premium-nav-link flex items-center gap-1" title="AI Kitchen Match">
        ✨ AI Match
      </AdminAwareLink>
      <AdminAwareLink href="/about" className="premium-nav-link">
        About
      </AdminAwareLink>
      <AdminAwareLink href="/support" className="premium-nav-link">
        Support
      </AdminAwareLink>
    </nav>
  )
}