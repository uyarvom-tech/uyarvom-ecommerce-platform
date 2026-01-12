'use client'

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Shield } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export function AdminConsoleButton() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

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
