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
  ChevronLeft,
  FolderOpen,
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
  
  const isAdmin = userRole === 'super_admin'

  // Filter sub-categories based on search
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

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete category')
      }

      toast.success('Sub-category deleted successfully!')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete sub-category')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header with Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/catalog')}
            className="p-1"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Categories</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">{mainCategory.name}</span>
            </div>
            <h1 className="text-2xl font-semibold">{mainCategory.name}</h1>
            {mainCategory.description && (
              <p className="text-sm text-muted-foreground">{mainCategory.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/catalog/${mainCategory.id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Category
          </Button>
          <Button onClick={() => router.push(`/admin/catalog/${mainCategory.id}/new`)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Sub-Category
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sub-categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredSubCategories.length} sub-categories
        </div>
      </div>

      {/* Sub-Categories List */}
      <div className="border rounded-lg">
        {filteredSubCategories.length === 0 ? (
          <div className="p-8 text-center">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No sub-categories found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? `No sub-categories match "${searchQuery}"` 
                : `Create your first sub-category under "${mainCategory.name}"`
              }
            </p>
            <Button onClick={() => router.push(`/admin/catalog/${mainCategory.id}/new`)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Sub-Category
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {filteredSubCategories.map((subCategory) => (
              <div
                key={subCategory.id}
                className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors cursor-pointer group"
                onClick={() => router.push(`/admin/catalog/${mainCategory.id}/${subCategory.id}`)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FolderOpen className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{subCategory.name}</span>
                      {!subCategory.isActive && (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    {subCategory.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {subCategory.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-shrink-0">
                    <span>{subCategory.productCount} products</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                
                <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/admin/products/new?mainCategory=${mainCategory.id}&subCategory=${subCategory.id}`)
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
                      router.push(`/admin/catalog/${mainCategory.id}/${subCategory.id}/edit`)
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
                      handleDeleteCategory(subCategory)
                    }}
                    disabled={subCategory.productCount > 0}
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
            <AlertDialogTitle>Delete Sub-Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{categoryToDelete?.name}"? This action cannot be undone.
              {(categoryToDelete?.productCount || 0) > 0 && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  This sub-category has {categoryToDelete?.productCount} products. Please move them to other sub-categories first.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={(categoryToDelete?.productCount || 0) > 0 || isDeleting}
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
