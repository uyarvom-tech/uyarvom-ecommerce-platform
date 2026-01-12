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
  AlertTriangle
} from "lucide-react"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [deletionTicketOpen, setDeletionTicketOpen] = useState(false)
  const [ticketCategoryId, setTicketCategoryId] = useState<string | null>(null)
  const [ticketCategoryName, setTicketCategoryName] = useState<string>('')
  const [isDeleting, setIsDeleting] = useState(false)
  
  const isAdmin = userRole === 'super_admin'

  // Categories are already filtered to main categories only in the database query
  // Just apply search filter
  const mainCategories = categories
    .filter(category =>
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

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete category')
      }

      toast.success('Category deleted successfully!')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete category')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Manage your product categories and organization
          </p>
        </div>
        <Button onClick={() => router.push('/admin/catalog/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {mainCategories.length} categories
        </div>
      </div>

      {/* Categories List */}
      <div className="border rounded-lg">
        {mainCategories.length === 0 ? (
          <div className="p-8 text-center">
            <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No categories found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? `No categories match "${searchQuery}"` : 'Create your first category to start organizing products'}
            </p>
            <Button onClick={() => router.push('/admin/catalog/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {mainCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors cursor-pointer group"
                onClick={() => router.push(`/admin/catalog/${category.id}`)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Folder className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{category.name}</span>
                      {!category.isActive && (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    {category.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {category.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-shrink-0">
                    <span>{category.subCategoryCount} sub-categories</span>
                    <span>{category.productCount} products</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                
                <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/admin/catalog/${category.id}/new`)
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/admin/catalog/${category.id}/edit`)
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteCategory(category)
                    }}
                    disabled={category.productCount > 0 || category.subCategoryCount > 0}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{categoryToDelete?.name}"? This action cannot be undone.
              {((categoryToDelete?.productCount || 0) > 0 || (categoryToDelete?.subCategoryCount || 0) > 0) && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  This category has {categoryToDelete?.subCategoryCount} sub-categories and {categoryToDelete?.productCount} products. Please move them first.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={((categoryToDelete?.productCount || 0) > 0 || (categoryToDelete?.subCategoryCount || 0) > 0) || isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Category Deletion Ticket Modal */}
      <DeletionTicketModal
        isOpen={deletionTicketOpen}
        onClose={() => setDeletionTicketOpen(false)}
        type="category"
        itemId={ticketCategoryId || ''}
        itemName={ticketCategoryName}
        onTicketCreated={() => {
          toast.success('Deletion request submitted successfully!')
        }}
      />
    </div>
  )
}
