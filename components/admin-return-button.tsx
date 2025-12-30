'use client'

import { useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { ArrowLeft, Shield } from "lucide-react"
import Link from "next/link"

export function AdminReturnButton() {
  const searchParams = useSearchParams()
  const isFromAdmin = searchParams.get('admin') === 'true'

  if (!isFromAdmin) return null

  return (
    <div className="fixed top-20 right-4 z-[9999]">
      <Button asChild className="shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground">
        <Link href="/admin">
          <Shield className="mr-2 h-4 w-4" />
          Return to Admin Console
        </Link>
      </Button>
    </div>
  )
}