"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit } from "lucide-react"
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

export function AddressesList({ addresses, userId }: { addresses: any[]; userId: string }) {
  const [showDialog, setShowDialog] = useState(false)
  const [editingAddress, setEditingAddress] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const addressData = {
      user_id: userId,
      full_name: formData.get("fullName"),
      phone: formData.get("phone"),
      address_line1: formData.get("addressLine1"),
      address_line2: formData.get("addressLine2"),
      city: formData.get("city"),
      state: formData.get("state"),
      postal_code: formData.get("postalCode"),
    }

    let error

    if (editingAddress) {
      const result = await (supabase.from("addresses").update(addressData).eq("id", editingAddress.id) as any)
      error = result.error
    } else {
      const result = await (supabase.from("addresses").insert({
        ...addressData,
        is_default: addresses.length === 0,
      }) as any)
      error = result.error
    }

    if (error) {
      toast.error(editingAddress ? "Failed to update address" : "Failed to add address")
      return
    }

    toast.success(editingAddress ? "Address updated successfully" : "Address added successfully")
    setShowDialog(false)
    setEditingAddress(null)
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    const { error } = await (supabase.from("addresses").delete().eq("id", id) as any)

    if (error) {
      toast.error("Failed to delete address")
      return
    }

    toast.success("Address deleted successfully")
    router.refresh()
  }

  const openEditDialog = (address: any) => {
    setEditingAddress(address)
    setShowDialog(true)
  }

  const closeDialog = () => {
    setShowDialog(false)
    setEditingAddress(null)
  }

  return (
    <div className="space-y-4">
      {addresses.length === 0 ? (
        <p className="text-center text-muted-foreground">No saved addresses</p>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => (
            <Card key={address.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <p className="font-semibold">{address.full_name}</p>
                      {address.is_default && <Badge variant="secondary">Default</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{address.address_line1}</p>
                    {address.address_line2 && <p className="text-sm text-muted-foreground">{address.address_line2}</p>}
                    <p className="text-sm text-muted-foreground">
                      {address.city}, {address.state} {address.postal_code}
                    </p>
                    <p className="text-sm text-muted-foreground">Phone: {address.phone}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(address)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(address.id)}
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
            Add New Address
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAddress ? "Edit Address" : "Add New Address"}</DialogTitle>
            <DialogDescription>Enter your address details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" name="fullName" defaultValue={editingAddress?.full_name || ""} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={editingAddress?.phone || ""} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressLine1">Address Line 1</Label>
              <Input
                id="addressLine1"
                name="addressLine1"
                defaultValue={editingAddress?.address_line1 || ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
              <Input id="addressLine2" name="addressLine2" defaultValue={editingAddress?.address_line2 || ""} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" defaultValue={editingAddress?.city || ""} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" name="state" defaultValue={editingAddress?.state || ""} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input id="postalCode" name="postalCode" defaultValue={editingAddress?.postal_code || ""} required />
            </div>
            <Button type="submit" className="w-full">
              {editingAddress ? "Update Address" : "Save Address"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
