"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface User {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
}

export function AccountForm({ user }: { user: User }) {
  const [fullName, setFullName] = useState(user?.fullName || "")
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName: fullName
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      toast.success("Profile updated successfully")
      router.refresh()
    } catch (error: any) {
      console.error('Profile update error:', error)
      toast.error(error.message || "Failed to update profile")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-black">Email</Label>
        <Input id="email" type="email" value={user.email} disabled className="rounded-none border-muted h-12 bg-muted/20 cursor-not-allowed text-xs font-bold" />
        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">Email cannot be changed</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-[10px] font-bold uppercase tracking-widest text-black">Full Name</Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Enter your full name"
          required
          className="rounded-none border-muted h-12 text-xs font-bold focus-visible:ring-black shadow-sm"
        />
      </div>
      <Button type="submit" disabled={isUpdating} className="w-full md:w-auto bg-black text-white hover:bg-black/90 rounded-none h-12 px-8 text-[10px] font-bold uppercase tracking-widest transition-all mt-4">
        {isUpdating ? "Updating..." : "Save Changes"}
      </Button>
    </form>
  )
}
