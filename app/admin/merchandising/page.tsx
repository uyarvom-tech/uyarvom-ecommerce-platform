import { prisma } from "@/lib/prisma"
import { AdminHeader } from "@/components/admin-header"
import { MerchandisingManager } from "@/components/admin/merchandising-manager"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function AdminMerchandisingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login?redirect=/admin/merchandising")

  const admin = await prisma.adminUser.findUnique({ where: { userId: user.id } })
  if (!admin || admin.role !== "super_admin") redirect("/admin")

  const banners = await prisma.heroBanner.findMany({
    orderBy: { displayOrder: "asc" },
  })

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <AdminHeader />
      <main className="flex-1 px-8 py-10">
        <div className="container mx-auto max-w-7xl">
          <MerchandisingManager banners={banners} />
        </div>
      </main>
    </div>
  )
}
