"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ImagePlus, Layout, Trash2, Edit2, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { deleteHeroBanner, upsertHeroBanner } from "@/lib/actions/merchandising"

export interface MerchandisingBanner {
  id: string
  title: string
  subtitle: string | null
  imageUrl: string
  linkUrl: string | null
  buttonText: string | null
  displayOrder: number
  isActive: boolean
}

type BannerFormState = {
  id?: string
  title: string
  subtitle: string
  imageUrl: string
  linkUrl: string
  buttonText: string
  displayOrder: string
  isActive: boolean
}

const emptyForm: BannerFormState = {
  title: "",
  subtitle: "",
  imageUrl: "",
  linkUrl: "",
  buttonText: "",
  displayOrder: "0",
  isActive: true,
}

export function MerchandisingManager({ banners }: { banners: MerchandisingBanner[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<MerchandisingBanner | null>(null)
  const [deletingBanner, setDeletingBanner] = useState<MerchandisingBanner | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<BannerFormState>(emptyForm)

  useEffect(() => {
    if (!formOpen) {
      setEditingBanner(null)
      setForm(emptyForm)
      setError(null)
    }
  }, [formOpen])

  const headerLabel = useMemo(() => (editingBanner ? "Edit Banner" : "Create Banner"), [editingBanner])

  const openCreate = () => {
    setEditingBanner(null)
    setForm(emptyForm)
    setError(null)
    setFormOpen(true)
  }

  const openEdit = (banner: MerchandisingBanner) => {
    setEditingBanner(banner)
    setForm({
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle || "",
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl || "",
      buttonText: banner.buttonText || "",
      displayOrder: String(banner.displayOrder ?? 0),
      isActive: banner.isActive,
    })
    setError(null)
    setFormOpen(true)
  }

  const submitForm = () => {
    setError(null)
    startTransition(async () => {
      const result = await upsertHeroBanner({
        id: form.id,
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || undefined,
        imageUrl: form.imageUrl.trim(),
        linkUrl: form.linkUrl.trim() || undefined,
        buttonText: form.buttonText.trim() || undefined,
        displayOrder: Number(form.displayOrder) || 0,
        isActive: form.isActive,
      })

      if (result?.error) {
        setError(result.error)
        return
      }

      setFormOpen(false)
      router.refresh()
    })
  }

  const confirmDelete = () => {
    if (!deletingBanner) return
    setError(null)

    startTransition(async () => {
      const result = await deleteHeroBanner(deletingBanner.id)
      if (result?.error) {
        setError(result.error)
        return
      }

      setDeleteOpen(false)
      setDeletingBanner(null)
      router.refresh()
    })
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2 uppercase">Brand Identity Matrix</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">Manage homepage visuals and hero merchandising</p>
        </div>
        <Button
          type="button"
          onClick={openCreate}
          className="bg-black text-white hover:bg-black/90 rounded-none h-12 px-8 text-[10px] font-bold uppercase tracking-widest"
        >
          <ImagePlus className="mr-2 h-4 w-4" />
          Initialize New Banner
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {banners.map((banner) => (
          <Card key={banner.id} className="rounded-none border-none shadow-sm overflow-hidden group">
            <div className="relative aspect-[21/9] bg-black">
              <Image src={banner.imageUrl} alt={banner.title} fill className="object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
              <div className="absolute inset-x-6 bottom-6">
                <Badge className={`mb-3 rounded-none px-3 text-[9px] font-black uppercase tracking-widest ${banner.isActive ? "bg-green-600" : "bg-red-600"}`}>
                  {banner.isActive ? "Active" : "Inactive"}
                </Badge>
                <h3 className="text-white font-playfair text-2xl font-black mb-1">{banner.title}</h3>
                <p className="text-white/70 text-[10px] uppercase tracking-widest font-bold truncate">{banner.subtitle}</p>
              </div>
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => openEdit(banner)}
                  className="h-8 w-8 bg-white text-black flex items-center justify-center hover:bg-primary transition-colors"
                  aria-label={`Edit ${banner.title}`}
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeletingBanner(banner)
                    setError(null)
                    setDeleteOpen(true)
                  }}
                  className="h-8 w-8 bg-white text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
                  aria-label={`Delete ${banner.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <CardContent className="p-6 bg-white border-t">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>Sequence: 0{banner.displayOrder}</span>
                  {banner.linkUrl && <span>Dest: {banner.linkUrl}</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {banners.length === 0 && (
          <Card className="lg:col-span-2 border-2 border-dashed border-muted bg-white/50 p-20 flex flex-col items-center justify-center text-center">
            <Layout className="h-10 w-10 text-muted-foreground mb-4 opacity-20" />
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">No active banners found</p>
            <Button type="button" onClick={openCreate} className="mt-6 bg-black text-white px-8 h-10 text-[10px] items-center gap-2">
              <Plus className="h-4 w-4" />
              Construct Primary Banner
            </Button>
          </Card>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{headerLabel}</DialogTitle>
            <DialogDescription>Update banner content and publishing settings.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="banner-title">Title</Label>
              <Input id="banner-title" value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="banner-subtitle">Subtitle</Label>
              <Input id="banner-subtitle" value={form.subtitle} onChange={(e) => setForm((current) => ({ ...current, subtitle: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="banner-image">Image URL</Label>
              <Input id="banner-image" value={form.imageUrl} onChange={(e) => setForm((current) => ({ ...current, imageUrl: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="banner-link">Link URL</Label>
              <Input id="banner-link" value={form.linkUrl} onChange={(e) => setForm((current) => ({ ...current, linkUrl: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="banner-button">Button Text</Label>
              <Input id="banner-button" value={form.buttonText} onChange={(e) => setForm((current) => ({ ...current, buttonText: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="banner-order">Display Order</Label>
              <Input id="banner-order" type="number" value={form.displayOrder} onChange={(e) => setForm((current) => ({ ...current, displayOrder: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((current) => ({ ...current, isActive: e.target.checked }))}
              />
              Active
            </label>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={submitForm} disabled={isPending}>
                {isPending ? "Saving..." : "Save Banner"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Banner</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingBanner ? `Remove "${deletingBanner.title}" from merchandising?` : "Remove this banner from merchandising?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p className="px-6 text-sm text-destructive">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingBanner(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
