import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Home } from "lucide-react"

export async function AdminHeader() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/admin" className="text-xl font-bold tracking-tight">
            Uyarvom Admin
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/admin/orders" className="text-sm font-medium transition-colors hover:text-primary">
              Orders
            </Link>
            <Link href="/admin/products" className="text-sm font-medium transition-colors hover:text-primary">
              Products
            </Link>
            <Link href="/admin/categories" className="text-sm font-medium transition-colors hover:text-primary">
              Categories
            </Link>
            <Link href="/admin/inventory" className="text-sm font-medium transition-colors hover:text-primary">
              Inventory
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              View Store
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Admin Account</span>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form action="/auth/signout" method="post" className="w-full">
                  <button type="submit" className="flex w-full cursor-pointer items-center text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
