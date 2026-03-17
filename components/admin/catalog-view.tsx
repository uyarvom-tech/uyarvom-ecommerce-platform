'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { DeletionTicketModal } from "@/components/admin/deletion-ticket-modal"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  Folder,
  LayoutGrid,
  List,
  Filter
} from "lucide-react"
import { toast } from "sonner"
import Image from 'next/image'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
  imageUrl?: string | null
  productCount: number
  subCategoryCount: number
}

interface CatalogViewProps {
  categories: Category[]
  userRole?: string
}

export function CatalogView({ categories, userRole = 'staff' }: CatalogViewProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [deletionTicketOpen, setDeletionTicketOpen] = useState(false)
  const [ticketCategoryId, setTicketCategoryId] = useState<string | null>(null)
  const [ticketCategoryName, setTicketCategoryName] = useState<string>('')
  const [isDeleting, setIsDeleting] = useState(false)

  const isAdmin = userRole === 'super_admin' || userRole === 'admin'

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDeleteCategory = (category: Category) => {
    if (isAdmin) {
      setCategoryToDelete(category)
      setDeleteDialogOpen(true)
    } else {
      setTicketCategoryId(category.id)
      setTicketCategoryName(category.name)
      setDeletionTicketOpen(true)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/categories/${categoryToDelete.id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete')
      toast.success('Category purged from library')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
    }
  }

  return (
    <div className="space-y-10">
      {/* Operative Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black tracking-tighter uppercase mb-2">Architectural Nodes</h1>
          <p className="text-muted-foreground text-sm font-bold uppercase tracking-[.3em]">Configure high-level taxonomies for digital distribution</p>
        </div>
        <Button
          onClick={() => router.push('/admin/catalog/new')}
          className="bg-black text-white hover:bg-black/90 rounded-none h-12 px-8 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Initialize New Category
        </Button>
      </div>

      {/* Global Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-6 border-b border-black/5 pb-8">
        <div className="flex items-center gap-4 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Find category node..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 rounded-none border-muted h-11 text-xs bg-white shadow-sm"
            />
          </div>
          <Button variant="outline" className="rounded-none border-muted h-11 px-4 text-[10px] font-bold uppercase tracking-widest bg-white">
            <Filter className="h-4 w-4 mr-2" /> Filter
          </Button>
        </div>

        <div className="flex items-center gap-2 p-1 bg-muted/50 border">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 transition-all ${viewMode === 'grid' ? 'bg-black text-white' : 'text-muted-foreground hover:bg-white'}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 transition-all ${viewMode === 'list' ? 'bg-black text-white' : 'text-muted-foreground hover:bg-white'}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Render Surface */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="group relative bg-white border border-black/5 overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer"
              onClick={() => router.push(`/admin/catalog/${category.id}`)}
            >
              <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                {category.imageUrl ? (
                  <Image src={category.imageUrl} alt={category.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700 grayscale group-hover:grayscale-0" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center opacity-10">
                    <Folder className="h-16 w-16" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/admin/catalog/${category.id}/edit`); }}
                      className="p-3 bg-white text-black hover:bg-black hover:text-white transition-all shadow-xl"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category); }}
                      className="p-3 bg-white text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-xl"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="p-3 bg-primary text-black">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-black text-lg uppercase tracking-tight">{category.name}</h3>
                  {!category.isActive && (
                    <Badge variant="outline" className="rounded-none text-[8px] font-black border-red-200 text-red-600 py-0 px-2 uppercase">Inactive</Badge>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-6 h-4 overflow-hidden truncate">
                  {category.description || 'No conceptual description'}
                </p>
                <div className="flex justify-between items-center border-t border-black/5 pt-4">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Topology</p>
                    <p className="text-[10px] font-black uppercase tracking-widest">{category.subCategoryCount} Childs</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Inventory</p>
                    <p className="text-[10px] font-black uppercase tracking-widest">{category.productCount} Assets</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border rounded-none overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-muted/30 text-[10px] font-black uppercase tracking-[.2em] text-muted-foreground">
                <th className="px-6 py-4">Node Identity</th>
                <th className="px-6 py-4">Structure</th>
                <th className="px-6 py-4">Asset Volume</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {filteredCategories.map((category) => (
                <tr
                  key={category.id}
                  className="hover:bg-muted/10 transition-colors group cursor-pointer"
                  onClick={() => router.push(`/admin/catalog/${category.id}`)}
                >
                  <td className="px-6 py-6">
                    <p className="font-bold text-base uppercase tracking-tight">{category.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-widest">{category.slug}</p>
                  </td>
                  <td className="px-6 py-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      {category.subCategoryCount} Sub-Categories
                    </p>
                  </td>
                  <td className="px-6 py-6">
                    <p className="text-sm font-black italic tracking-tighter">
                      {category.productCount} Global Assets
                    </p>
                  </td>
                  <td className="px-6 py-6">
                    <Badge variant="outline" className={`rounded-none px-3 text-[10px] font-bold uppercase tracking-widest ${category.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {category.isActive ? 'Active' : 'Offline'}
                    </Badge>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-black hover:text-white transition-all"><Edit className="h-4 w-4" /></button>
                      <button className="p-2 hover:bg-red-600 hover:text-white transition-all"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {filteredCategories.length === 0 && (
        <div className="py-32 text-center border-2 border-dashed border-black/5 bg-white shadow-inner">
          <Folder className="h-20 w-20 mx-auto mb-6 text-muted-foreground opacity-10" />
          <h3 className="text-2xl font-black uppercase tracking-tight mb-2">No nodes discovered</h3>
          <p className="text-muted-foreground font-bold uppercase tracking-[.2em] text-[10px]">Adjust search parameters or initialize new high-level node</p>
        </div>
      )}

      {/* Multi-tier Deletion Controls */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-none border-4 border-black">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black uppercase tracking-tighter text-3xl italic">Confirm Purge</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-bold uppercase tracking-widest py-4 border-y border-black/5 my-4">
              Authorized personnel only. Are you sure you want to permanently delete "{categoryToDelete?.name}"? All relational data will be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none uppercase text-xs font-black">Abort</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 text-white rounded-none uppercase text-xs font-black hover:bg-red-700"
            >
              {isDeleting ? 'Processing...' : 'Execute Purge'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DeletionTicketModal
        isOpen={deletionTicketOpen}
        onClose={() => setDeletionTicketOpen(false)}
        type="category"
        itemId={ticketCategoryId || ''}
        itemName={ticketCategoryName}
        onTicketCreated={() => toast.success('Purge request registered in governance log')}
      />
    </div>
  )
}
