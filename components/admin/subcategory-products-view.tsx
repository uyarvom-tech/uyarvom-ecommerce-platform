'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Plus,
  Edit,
  Eye,
  ChevronRight,
  ChevronLeft,
  Package,
  Filter,
  ArrowUpRight
} from "lucide-react"

interface Product {
  id: string
  name: string
  slug: string
  sku: string
  price: number
  stockQuantity: number
  isActive: boolean
  primaryImage?: string
}

interface SubCategory {
  id: string
  name: string
  slug: string
  description: string | null
}

interface MainCategory {
  id: string
  name: string
  slug: string
}

interface SubCategoryProductsViewProps {
  mainCategory: MainCategory
  subCategory: SubCategory
  products: Product[]
  userRole?: string
}

export function SubCategoryProductsView({ mainCategory, subCategory, products, userRole = 'staff' }: SubCategoryProductsViewProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-10">
      {/* Operative Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex gap-6">
          <button
            onClick={() => router.push(`/admin/catalog/${mainCategory.id}`)}
            className="h-12 w-12 border border-black/10 flex items-center justify-center hover:bg-black hover:text-white transition-all bg-white"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-[.3em] text-muted-foreground">{mainCategory.name}</span>
              <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
              <span className="text-[10px] font-black uppercase tracking-[.3em]">{subCategory.name}</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase mb-4">{subCategory.name}</h1>
            <p className="max-w-xl text-muted-foreground text-sm font-medium leading-relaxed italic border-l-2 border-black/5 pl-6 py-1">
              {subCategory.description || `Deploying assets under the ${subCategory.name} branch of the ${mainCategory.name} hierarchy.`}
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/catalog/${mainCategory.id}/${subCategory.id}/edit`)}
            className="rounded-none border-black h-12 px-8 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all"
          >
            <Edit className="mr-2 h-4 w-4" /> Edit Branch
          </Button>
          <Button
            onClick={() => router.push(`/admin/products/new?mainCategory=${mainCategory.id}&subCategory=${subCategory.id}`)}
            className="bg-black text-white hover:bg-black/90 rounded-none h-12 px-8 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Onboard Asset
          </Button>
        </div>
      </div>

      {/* Surface Control */}
      <div className="flex items-center justify-between border-b border-black/5 pb-8">
        <div className="flex items-center gap-4 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Asset ID / SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 rounded-none border-muted h-11 text-xs bg-white shadow-sm"
            />
          </div>
          <Button variant="outline" className="rounded-none border-muted h-11 px-6 text-[10px] font-bold uppercase tracking-widest bg-white">
            <Filter className="h-4 w-4 mr-2" /> Sort Intelligence
          </Button>
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          {filteredProducts.length} Global Assets Found
        </div>
      </div>

      {/* Asset Repository */}
      <div className="bg-white border rounded-none overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b bg-muted/30 text-[10px] font-black uppercase tracking-[.2em] text-muted-foreground">
              <th className="px-6 py-4">Asset Definition</th>
              <th className="px-6 py-4">Identifier</th>
              <th className="px-6 py-4">Financials</th>
              <th className="px-6 py-4">Physical Count</th>
              <th className="px-6 py-4 text-right">Status</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-muted/10 transition-colors group">
                <td className="px-6 py-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-muted shrink-0 overflow-hidden rounded-none border border-black/5">
                      {product.primaryImage ? (
                        <img src={product.primaryImage} alt="" className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center opacity-10">
                          <Package className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-sm uppercase tracking-tight truncate">{product.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-widest leading-none">/{product.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6 font-mono text-xs opacity-50">
                  {product.sku || 'N/A-UID'}
                </td>
                <td className="px-6 py-6">
                  <p className="font-black text-sm italic">₹{product.price.toLocaleString("en-IN")}</p>
                  <p className="text-[8px] font-bold uppercase text-muted-foreground opacity-60">Base Valuation</p>
                </td>
                <td className="px-6 py-6">
                  <div className="flex items-center gap-2">
                    <span className={`text-base font-black ${product.stockQuantity <= 10 ? 'text-red-600' : 'text-black'}`}>
                      {product.stockQuantity}
                    </span>
                    <span className="text-[8px] font-bold uppercase text-muted-foreground">Units</span>
                  </div>
                </td>
                <td className="px-6 py-6 text-right">
                  <Badge variant="outline" className={`rounded-none px-3 text-[9px] font-black uppercase tracking-widest ${product.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {product.isActive ? "Operative" : "Offline"}
                  </Badge>
                </td>
                <td className="px-6 py-6 text-right">
                  <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => router.push(`/admin/products/${product.id}/edit`)} title="Edit Resource" className="p-2 hover:bg-black hover:text-white transition-all"><Edit className="h-4 w-4" /></button>
                    <button onClick={() => router.push(`/products/${product.slug}`)} title="View in Terminal" className="p-2 hover:bg-primary transition-all"><ArrowUpRight className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredProducts.length === 0 && (
          <div className="py-24 text-center">
            <Package className="h-20 w-20 mx-auto mb-6 text-muted-foreground opacity-10" />
            <p className="text-[10px] font-black uppercase tracking-[.3em] text-muted-foreground">No matching asset groups discovered in this branch</p>
          </div>
        )}
      </div>
    </div>
  )
}
