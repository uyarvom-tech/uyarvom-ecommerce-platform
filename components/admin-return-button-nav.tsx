import { isCurrentUserAdmin } from "@/lib/admin-auth"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export async function AdminReturnButtonNav() {
  const isAdmin = await isCurrentUserAdmin()

  if (!isAdmin) return null

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="h-8 px-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 transition-all duration-300 font-medium shadow-sm" 
      asChild
    >
      <Link href="/admin">
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
        Return to Admin
      </Link>
    </Button>
  )
}