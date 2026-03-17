'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  ChevronLeft,
  FolderOpen,
  Filter,
  MoreVertical,
  Layers
} from "lucide-react"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
  productCount: number
}

interface MainCategory {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
}

interface CategoryDetailViewProps {
  mainCategory: MainCategory
  subCategories: Category[]
  userRole?: string
}

export function CategoryDetailView({ mainCategory, subCategories, userRole = 'staff' }: CategoryDetailViewProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [deletionTicketOpen, setDeletionTicketOpen] = useState(false)
  const [ticketCategoryId, setTicketCategoryId] = useState<string | null>(null)
  const [ticketCategoryName, setTicketCategoryName] = useState<string>('')
  const [isDeleting, setIsDeleting] = useState(false)

  const isAdmin = userRole === 'super_admin' || userRole === 'admin'

  const filteredSubCategories = subCategories.filter(category =>
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
      toast.success('Logical sub-node pruned')
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
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex gap-6">
          <button
            onClick={() => router.push('/admin/catalog')}
            className="h-12 w-12 border border-black/10 flex items-center justify-center hover:bg-black hover:text-white transition-all bg-white"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-[.3em] text-muted-foreground">Architectural Tree</span>
              <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
              <span className="text-[10px] font-black uppercase tracking-[.3em]">{mainCategory.name}</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase mb-4">{mainCategory.name}</h1>
            <p className="max-w-xl text-muted-foreground text-sm font-medium leading-relaxed italic border-l-2 border-black/5 pl-6 py-1">
              {mainCategory.description || 'No specialized metadata available for this node.'}
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/catalog/${mainCategory.id}/edit`)}
            className="rounded-none border-black h-12 px-8 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all"
          >
            <Edit className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
          <Button
            onClick={() => router.push(`/admin/catalog/${mainCategory.id}/new`)}
            className="bg-black text-white hover:bg-black/90 rounded-none h-12 px-8 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Append Sub-Node
          </Button>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-3">
        {/* Left: Sub-Category Intelligence */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between border-b border-black/5 pb-6">
            <h3 className="text-xs font-black uppercase tracking-[.2em] flex items-center gap-2">
              <Layers className="h-4 w-4" /> Relational Sub-Nodes ({subCategories.length})
            </h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Filter hierarchy..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 border-muted rounded-none text-xs bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredSubCategories.map((sub) => (
              <div key={sub.id} className="group border bg-white p-6 hover:shadow-xl hover:border-black transition-all cursor-pointer overflow-hidden relative" onClick={() => router.push(`/admin/catalog/${mainCategory.id}/${sub.id}`)}>
                <div className="flex justify-between items-start mb-6">
                  <div className="h-10 w-10 bg-muted flex items-center justify-center shrink-0">
                    <FolderOpen className="h-5 w-5 text-black" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(sub); }} className="p-2 hover:bg-red-50 text-red-600"><Trash2 className="h-4 w-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); router.push(`/admin/catalog/${mainCategory.id}/${sub.id}/edit`); }} className="p-2 hover:bg-muted"><Edit className="h-4 w-4" /></button>
                  </div>
                </div>
                <h4 className="font-black text-lg uppercase tracking-tight mb-1">{sub.name}</h4>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">/{sub.slug}</p>
                <div className="flex justify-between items-end">
                  <Badge variant="outline" className="rounded-none text-[9px] font-black uppercase border-black/10">
                    {sub.productCount} Assets Linked
                  </Badge>
                  <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
                {!sub.isActive && <div className="absolute top-0 right-0 p-1 bg-red-600 text-white text-[7px] font-black uppercase tracking-[.2em] px-2">Offline</div>}
              </div>
            ))}

            {filteredSubCategories.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-black/5 bg-white/50">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">No child nodes discovered in this branch</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Asset Health & Control */}
        <div className="space-y-10">
          <Card className="rounded-none border-none bg-black text-white p-8">
            <h3 className="text-[10px] font-black uppercase tracking-[.3em] mb-8 pb-4 border-b border-white/10">Hierarchy Control</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white/5 p-4 border-l-2 border-primary">
                <div>
                  <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Global Assets</p>
                  <p className="text-2xl font-black italic tracking-tighter">
                    {subCategories.reduce((acc, s) => acc + s.productCount, 0)}
                  </p>
                </div>
                <Layers className="h-8 w-8 text-primary opacity-30" />
              </div>

              <div className="pt-6">
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-3">Governance Status</p>
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${mainCategory.isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{mainCategory.isActive ? 'Network Live' : 'Network Obscured'}</span>
                </div>
              </div>

              <div className="pt-10 flex flex-col gap-3">
                <button className="h-11 border border-white/20 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                  Synchronize Assets
                </button>
                <button className="h-11 border border-white/20 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:border-red-600 transition-all">
                  Decommission Node
                </button>
              </div>
            </div>
          </Card>

          <div className="bg-white border p-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <MoreVertical className="h-3 w-3" /> Branch Operations
            </h4>
            <ul className="space-y-4">
              <li>
                <button className="text-[10px] font-bold uppercase tracking-widest underline decoration-muted hover:decoration-black transition-all">
                  Export Logical Structure (.JSON)
                </button>
              </li>
              <li>
                <button className="text-[10px] font-bold uppercase tracking-widest underline decoration-muted hover:decoration-black transition-all">
                  Move all children to sibling
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-none border-4 border-black">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black uppercase tracking-tighter text-3xl italic">Purge Sub-Node</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-bold uppercase tracking-widest py-4 border-y border-black/5 my-4">
              Authorized personnel only. Deleting "{categoryToDelete?.name}" will decouple linked assets. This action is irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none uppercase text-xs font-black">Abort</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 text-white rounded-none uppercase text-xs font-black hover:bg-red-700"
            >
              {isDeleting ? 'Executing...' : 'Confirm Purge'}
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
        onTicketCreated={() => toast.success('Purge request submitted for administrative review')}
      />
    </div>
  )
}
