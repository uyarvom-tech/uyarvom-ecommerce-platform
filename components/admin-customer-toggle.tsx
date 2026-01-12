'use client'

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Shield, Users } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

export function AdminCustomerToggle() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const supabase = createClient()

  // Check if we're currently in admin view
  const isInAdminView = pathname.startsWith('/admin')

  useEffect(() => {
    const checkAdminStatus = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      
      const userRole = user?.user_metadata?.role || 'customer'
      const canAccessAdmin = userRole === 'admin' || userRole === 'staff'
      
      setIsAdmin(canAccessAdmin)
      setLoading(false)
    }

    checkAdminStatus()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const userRole = session?.user?.user_metadata?.role || 'customer'
      const canAccessAdmin = userRole === 'admin' || userRole === 'staff'
      setIsAdmin(canAccessAdmin)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  if (loading || !isAdmin) {
    return null
  }

  // If in admin view, show "Customer View" button
  if (isInAdminView) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-8 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 transition-all duration-300 font-medium shadow-sm" 
        asChild
      >
        <Link href="/">
          <Users className="mr-1.5 h-3.5 w-3.5" />
          Customer View
        </Link>
      </Button>
    )
  }

  // If in customer view, show "Admin Console" button
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="h-8 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 transition-all duration-300 font-medium shadow-sm" 
      asChild
    >
      <Link href="/admin">
        <Shield className="mr-1.5 h-3.5 w-3.5" />
        Admin Console
      </Link>
    </Button>
  )
}
