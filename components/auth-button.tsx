"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Package, Settings, Shield, Crown } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface UserProfile {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'customer' | 'staff'
  phone?: string
}

export function AuthButton() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    
    const getUser = async () => {
      try {
        // Check if we're using placeholder Supabase credentials (demo mode)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
        const isDemo = supabaseUrl.includes('placeholder')
        
        if (isDemo) {
          // Demo mode - use localStorage
          const savedUser = localStorage.getItem('demo-user')
          if (savedUser) {
            try {
              const demoUser = JSON.parse(savedUser)
              setUser(demoUser)
            } catch (e) {
              localStorage.removeItem('demo-user')
              setUser(null)
            }
          } else {
            setUser(null)
          }
        } else {
          // Production mode - use Supabase
          const { data: { user: supabaseUser } } = await supabase.auth.getUser()
          
          if (supabaseUser) {
            // Check if user is admin
            const { data: adminUser } = await supabase
              .from('admin_users')
              .select('role')
              .eq('user_id', supabaseUser.id)
              .single()
            
            setUser({
              id: supabaseUser.id,
              email: supabaseUser.email || '',
              full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
              role: adminUser?.role || 'customer'
            })
          } else {
            setUser(null)
          }
        }
      } catch (error) {
        console.error('Error getting user:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null)
        localStorage.removeItem('demo-user')
      } else if (event === 'SIGNED_IN' && session) {
        getUser()
      }
    })

    // Listen for storage changes (demo mode)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'demo-user') {
        getUser()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      subscription.unsubscribe()
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const handleSignOut = async () => {
    setLoading(true)
    
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const isDemo = supabaseUrl.includes('placeholder')
      
      if (isDemo) {
        // Demo mode logout
        await fetch('/api/auth/logout', {
          method: 'POST',
        })
        localStorage.removeItem('demo-user')
      } else {
        // Supabase logout
        await supabase.auth.signOut()
      }
      
      setUser(null)
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" disabled>
        Loading...
      </Button>
    )
  }

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        Loading...
      </Button>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/auth/admin-login">Admin Login</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/auth/login">Customer Login</Link>
        </Button>
      </div>
    )
  }

  const userRole = user.role || 'customer'
  const userName = user.full_name || user.email?.split('@')[0] || 'User'
  const isAdmin = userRole === 'admin'
  const isStaff = userRole === 'staff'
  const canAccessAdmin = isAdmin || isStaff

  const getRoleIcon = () => {
    switch (userRole) {
      case 'admin':
        return <Crown className="h-3 w-3" />
      case 'staff':
        return <Shield className="h-3 w-3" />
      default:
        return <User className="h-3 w-3" />
    }
  }

  const getRoleBadgeColor = () => {
    switch (userRole) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'staff':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 max-w-[200px]">
          {getRoleIcon()}
          <span className="hidden sm:inline truncate">{userName}</span>
          <span className="sm:hidden">
            <User className="h-4 w-4" />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{userName}</span>
              <Badge className={`text-xs ${getRoleBadgeColor()}`}>
                {getRoleIcon()}
                <span className="ml-1 capitalize">{userRole}</span>
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Admin/Staff Menu Items */}
        {canAccessAdmin && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/admin" className="cursor-pointer">
                <Shield className="mr-2 h-4 w-4" />
                Admin Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        {/* Customer Menu Items */}
        <DropdownMenuItem asChild>
          <Link href="/account" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Account Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/orders" className="cursor-pointer">
            <Package className="mr-2 h-4 w-4" />
            My Orders
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
