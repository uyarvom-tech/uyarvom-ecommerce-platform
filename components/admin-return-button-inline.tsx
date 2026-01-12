'use client'

import { useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Shield } from "lucide-react"
import Link from "next/link"

export function AdminReturnButtonInline() {
  const searchParams = useSearchParams()
  const isFromAdmin = searchParams.get('admin') === 'true'

  if (!isFromAdmin) return null

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
