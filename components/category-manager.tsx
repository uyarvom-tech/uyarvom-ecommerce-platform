// @ts-nocheck
"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Edit, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function CategoryManager({ categories }: { categories: any[] }) {
  const [showDialog, setShowDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const categoryData = {
      name: formData.get("name"),
      slug: formData.get("slug"),
      description: formData.get("description"),
    }

    let error

    if (editingCategory) {
      const result = await supabase.from("categories").update(categoryData).eq("id", editingCategory.id)
      error = result.error
    } else {
      const result = await supabase.from("categories").insert({
        ...categoryData,
        display_order: categories.length,
      })
      error = result.error
    }

    if (error) {
      toast.error(editingCategory ? "Failed to update category" : "Failed to add category")
      return
    }

    toast.success(editingCategory ? "Category updated successfully" : "Category added successfully")
    setShowDialog(false)
    setEditingCategory(null)
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return

    const { error } = await supabase.from("categories").delete().eq("id", id)

    if (error) {
      toast.error("Failed to delete category")
      return
    }

    toast.success("Category deleted successfully")
    router.refresh()
  }

  const openEditDialog = (category: any) => {
    setEditingCategory(category)
    setShowDialog(true)
  }

  const closeDialog = () => {
    setShowDialog(false)
    setEditingCategory(null)
  }

  return (
    <div className="space-y-4">
      {categories.length === 0 ? (
        <p className="text-center text-muted-foreground">No categories yet</p>
      ) : (
        <div className="space-y-3">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold">{category.name}</p>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                    <p className="text-xs text-muted-foreground">Slug: {category.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(category)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(category.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={(open) => (open ? setShowDialog(true) : closeDialog())}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add New Category
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
            <DialogDescription>Enter category details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input id="name" name="name" defaultValue={editingCategory?.name || ""} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" name="slug" defaultValue={editingCategory?.slug || ""} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editingCategory?.description || ""}
                rows={3}
              />
            </div>
            <Button type="submit" className="w-full">
              {editingCategory ? "Update Category" : "Add Category"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
