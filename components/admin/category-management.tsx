"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  GripVertical,
  Package,
  ArrowUp,
  ArrowDown,
} from "lucide-react"

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl?: string | null
  displayOrder: number
  parentId?: string | null
  createdAt?: string
  productCount?: number
  subCategoryCount?: number
}

interface CategoryManagementProps {
  categories: Category[]
}

interface CategoryFormState {
  id?: string
  name: string
  slug: string
  description: string
  imageUrl: string
  displayOrder: string
}

const emptyForm: CategoryFormState = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  displayOrder: "0",
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function CategoryManagement({ categories }: CategoryManagementProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [localCategories, setLocalCategories] = useState<Category[]>(categories)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [form, setForm] = useState<CategoryFormState>(emptyForm)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLocalCategories(categories)
  }, [categories])

  const sortedCategories = useMemo(
    () => [...localCategories].sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name)),
    [localCategories],
  )

  const resetForm = () => {
    setEditingCategory(null)
    setForm(emptyForm)
    setError(null)
  }

  const openCreateDialog = () => {
    resetForm()
    setForm((current) => ({
      ...current,
      displayOrder: String(sortedCategories.length),
    }))
    setDialogOpen(true)
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    setForm({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      imageUrl: category.imageUrl || "",
      displayOrder: String(category.displayOrder ?? 0),
    })
    setError(null)
    setDialogOpen(true)
  }

  const submitCategory = () => {
    setError(null)

    if (!form.name.trim()) {
      setError("Category name is required")
      return
    }

    startTransition(async () => {
      const payload = {
        id: form.id,
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        description: form.description.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        displayOrder: Number(form.displayOrder) || 0,
        isActive: true,
      }

      const response = await fetch("/api/admin/categories", {
        method: editingCategory ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(result.error || "Failed to save category")
        return
      }

      toast.success(editingCategory ? "Category updated successfully" : "Category created successfully")
      setDialogOpen(false)
      resetForm()
      router.refresh()
    })
  }

  const deleteCategory = async (category: Category) => {
    if (!window.confirm(`Delete "${category.name}"?`)) return

    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: "DELETE",
      })

      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result.error || "Failed to delete category")
      }

      toast.success("Category deleted successfully")
      setLocalCategories((current) => current.filter((item) => item.id !== category.id))
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete category")
    }
  }

  const reorderCategories = async (categoryId: string, direction: "up" | "down") => {
    const currentIndex = sortedCategories.findIndex((category) => category.id === categoryId)
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= sortedCategories.length) {
      return
    }

    const nextOrder = [...sortedCategories]
    const [moved] = nextOrder.splice(currentIndex, 1)
    nextOrder.splice(targetIndex, 0, moved)

    setLocalCategories(nextOrder.map((category, index) => ({
      ...category,
      displayOrder: index,
    })))

    try {
      const response = await fetch("/api/admin/categories/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderedIds: nextOrder.map((category) => category.id) }),
      })

      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result.error || "Failed to reorder categories")
      }

      toast.success("Category order updated")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reorder categories")
      router.refresh()
    }
  }

  const getProductCount = (category: Category) => category.productCount || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Category Management</h1>
          <p className="text-muted-foreground">Organize your product categories and manage hierarchy</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="space-y-4">
        {sortedCategories.map((category, index) => (
          <Card key={category.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => reorderCategories(category.id, "up")}
                    disabled={index === 0 || isPending}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => reorderCategories(category.id, "down")}
                    disabled={index === sortedCategories.length - 1 || isPending}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>

                <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                  <Image
                    src={category.imageUrl || `/placeholder.svg?height=64&width=64&query=${category.name}`}
                    alt={category.name}
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{category.name}</h3>
                    <Badge variant="secondary">Order: {category.displayOrder}</Badge>
                    <Badge variant="outline">
                      <Package className="mr-1 h-3 w-3" />
                      {getProductCount(category)} products
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {category.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Slug: {category.slug}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(category)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Category
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={`/products?category=${category.slug}`} target="_blank" rel="noopener noreferrer">
                        <Package className="mr-2 h-4 w-4" />
                        View Products
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => deleteCategory(category)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Category
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}

        {sortedCategories.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No categories found</h3>
              <p className="text-muted-foreground">Create your first category to get started</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : setDialogOpen(false))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Category Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((current) => ({ ...current, name: e.target.value, slug: slugify(e.target.value) }))}
                placeholder="Enter category name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Slug</label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((current) => ({ ...current, slug: e.target.value }))}
                placeholder="category-slug"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                placeholder="Enter category description"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Image URL</label>
              <Input
                value={form.imageUrl}
                onChange={(e) => setForm((current) => ({ ...current, imageUrl: e.target.value }))}
                placeholder="Enter image URL"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Display Order</label>
              <Input
                type="number"
                value={form.displayOrder}
                onChange={(e) => setForm((current) => ({ ...current, displayOrder: e.target.value }))}
                placeholder="0"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submitCategory} disabled={isPending}>
                {editingCategory ? "Update Category" : "Create Category"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
