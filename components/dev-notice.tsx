"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Info, Users } from "lucide-react"
import Link from "next/link"

export function DevNotice() {
  // Only show in development with placeholder credentials
  const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')
  
  if (!isPlaceholder) return null
  
  return (
    <Card className="mb-4 border-blue-200 bg-blue-50">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 text-blue-800">
          <Info className="h-4 w-4 flex-shrink-0" />
          <div className="text-sm">
            <strong>Development Mode:</strong> Running with demo data and authentication.
          </div>
        </div>
        <Button size="sm" variant="outline" asChild className="border-blue-300 text-blue-800 hover:bg-blue-100">
          <Link href="/demo-login">
            <Users className="mr-2 h-4 w-4" />
            Demo Logins
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}