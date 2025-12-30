import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut } from "lucide-react"
import { AdminCustomerToggle } from "@/components/admin-customer-toggle"
import { AuthButton } from "@/components/auth-button"

export async function AdminHeader() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="premium-global-nav">
      <div className="max-w-[980px] mx-auto px-6">
        <div className="flex h-12 items-center">
          {/* Brand Logo - Left */}
          <Link href="/admin" className="flex items-center hover:opacity-80 transition-opacity duration-300 mr-8">
            <Image
              src="/logos/logo.png"
              alt="Uyarvom Admin"
              width={40}
              height={40}
              className="h-10 w-auto"
            />
          </Link>
          
          {/* Desktop Navigation - Center */}
          <nav className="hidden items-center gap-8 md:flex flex-1 justify-center">
            <Link href="/admin" className="premium-nav-link">
              Dashboard
            </Link>
            <Link href="/admin/products" className="premium-nav-link">
              Products
            </Link>
            <Link href="/admin/categories" className="premium-nav-link">
              Categories
            </Link>
            <Link href="/admin/orders" className="premium-nav-link">
              Orders
            </Link>
            <Link href="/admin/staff" className="premium-nav-link">
              Staff
            </Link>
            <Link href="/admin/inventory" className="premium-nav-link">
              Inventory
            </Link>
          </nav>

          {/* Desktop Actions - Right */}
          <div className="hidden md:flex items-center gap-2">
            <div className="w-px h-6 bg-amber-800/20 mx-2"></div>
            
            <AuthButton />
            
            <AdminCustomerToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
