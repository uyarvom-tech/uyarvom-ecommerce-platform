"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function AccountForm({ profile, userEmail }: { profile: any; userEmail: string }) {
  const [fullName, setFullName] = useState(profile?.full_name || "")
  const [phone, setPhone] = useState(profile?.phone || "")
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)

    const { error } = await supabase.from("profiles").update({ full_name: fullName, phone }).eq("id", profile.id)

    if (error) {
      toast.error("Failed to update profile")
    } else {
      toast.success("Profile updated successfully")
      router.refresh()
    }

    setIsUpdating(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={userEmail} disabled />
        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      </div>
      <Button type="submit" disabled={isUpdating}>
        {isUpdating ? "Updating..." : "Save Changes"}
      </Button>
    </form>
  )
}
