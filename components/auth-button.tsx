"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Package, Settings, Shield, User } from "lucide-react"

interface UserProfile {
  id: string
  email: string
  full_name: string
  role: "admin" | "customer" | "staff" | "super_admin"
}

export function AuthButton() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    setMounted(true)

    const getUser = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (!authUser) {
          setUser(null)
          return
        }

        const { data: adminUser } = await supabase
          .from("admin_users")
          .select("role")
          .eq("userId", authUser.id)
          .maybeSingle()

        setUser({
          id: authUser.id,
          email: authUser.email || "",
          full_name:
            authUser.user_metadata?.full_name ||
            authUser.user_metadata?.name ||
            authUser.email?.split("@")[0] ||
            "User",
          role: adminUser?.role || "customer",
        })
      } catch (error) {
        console.error("Error getting user:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    void getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void getUser()
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    setLoading(true)

    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted || loading) {
    return (
      <Button variant="ghost" size="sm" disabled className="h-11 rounded-xl px-4 text-sm">
        Loading
      </Button>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="h-11 rounded-xl px-4 text-sm">
          <Link href="/auth/admin-login">Admin</Link>
        </Button>
        <Button size="sm" asChild className="h-11 rounded-xl px-4 text-sm">
          <Link href="/auth/login">Sign In</Link>
        </Button>
      </div>
    )
  }

  const userRole = user.role || "customer"
  const userName = user.full_name || user.email?.split("@")[0] || "User"
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U"
  const canAccessAdmin = ["admin", "staff", "super_admin"].includes(userRole)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-12 max-w-[210px] gap-3 rounded-xl border border-primary/20 bg-white px-3 shadow-sm transition-all hover:border-primary/30 hover:bg-white"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold uppercase text-primary">
            {initials}
          </span>
          <span className="hidden truncate text-sm font-medium text-foreground sm:inline">{userName}</span>
          <span className="sm:hidden">
            <User className="h-4 w-4" />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 rounded-2xl border border-border/60 bg-white p-2 shadow-[0_18px_60px_rgba(17,17,17,0.12)]"
      >
        <div className="rounded-xl bg-secondary/35 px-3 py-3">
          <p className="text-sm font-semibold text-foreground">{userName}</p>
          <p className="mt-1 text-xs text-muted-foreground">{user.email}</p>
        </div>

        <DropdownMenuSeparator className="my-2" />

        {canAccessAdmin && (
          <DropdownMenuItem asChild className="rounded-xl px-3 py-3">
            <Link href="/admin" className="cursor-pointer">
              <Shield className="mr-2 h-4 w-4" />
              Admin Dashboard
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem asChild className="rounded-xl px-3 py-3">
          <Link href="/account" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="rounded-xl px-3 py-3">
          <Link href="/orders" className="cursor-pointer">
            <Package className="mr-2 h-4 w-4" />
            Orders
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-2" />
        <DropdownMenuItem onClick={handleSignOut} className="rounded-xl px-3 py-3 text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
