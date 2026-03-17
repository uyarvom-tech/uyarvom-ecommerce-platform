import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import { AdminCustomerToggle } from "@/components/admin-customer-toggle"
import { AuthButton } from "@/components/auth-button"

export async function AdminHeader() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isAdmin = false
  let isSuperAdmin = false
  if (user) {
    const adminUser = await prisma.adminUser.findUnique({
      where: { userId: user.id },
      select: { role: true }
    })
    isAdmin = ['admin', 'super_admin'].includes(adminUser?.role || '')
    isSuperAdmin = adminUser?.role === 'super_admin'
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-black text-white px-6 h-16 flex items-center shadow-xl">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/admin" className="font-playfair text-2xl font-black tracking-tighter hover:opacity-80 transition-opacity">
            UYARVOM <span className="text-primary text-[10px] tracking-[.3em] ml-2">ADMIN</span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            <Link href="/admin" className="text-[10px] font-bold uppercase tracking-[.2em] hover:text-primary transition-colors">
              Dashboard
            </Link>
            <Link href="/admin/catalog" className="text-[10px] font-bold uppercase tracking-[.2em] hover:text-primary transition-colors">
              Catalog
            </Link>
            <Link href="/admin/orders" className="text-[10px] font-bold uppercase tracking-[.2em] hover:text-primary transition-colors">
              Orders
            </Link>
            <Link href="/admin/inventory" className="text-[10px] font-bold uppercase tracking-[.2em] hover:text-primary transition-colors">
              Inventory
            </Link>
            <Link href="/admin/support" className="text-[10px] font-bold uppercase tracking-[.2em] hover:text-primary transition-colors">
              Support
            </Link>
            {isSuperAdmin && (
              <>
                <Link href="/admin/staff" className="text-[10px] font-bold uppercase tracking-[.2em] hover:text-primary transition-colors">
                  Staff
                </Link>
                <Link href="/admin/merchandising" className="text-[10px] font-bold uppercase tracking-[.2em] hover:text-primary transition-colors">
                  Identity
                </Link>
                <Link href="/admin/settings" className="text-[10px] font-bold uppercase tracking-[.2em] hover:text-primary transition-colors">
                  Parameters
                </Link>
                <Link href="/admin/tickets" className="text-[10px] font-bold uppercase tracking-[.2em] hover:text-primary transition-colors">
                  Governance
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <div className="h-4 w-px bg-white/20 hidden md:block" />
          <AuthButton />
          <AdminCustomerToggle />
        </div>
      </div>
    </header>
  )
}
