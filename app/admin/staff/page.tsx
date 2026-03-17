import { prisma } from "@/lib/prisma"
import { AdminHeader } from "@/components/admin-header"
import { StaffManagement } from "@/components/admin/staff-management"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function StaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/admin/staff")
  }

  const currentAdmin = await prisma.adminUser.findUnique({
    where: { userId: user.id }
  })

  // Only super_admins can manage staff usually, or at least admins.
  if (!currentAdmin || !['admin', 'super_admin'].includes(currentAdmin.role)) {
    redirect('/admin')
  }

  const staff = await prisma.user.findMany({
    where: {
      adminProfile: {
        isNot: null
      }
    },
    include: {
      adminProfile: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  const transformedStaff = staff.map((u: any) => ({
    id: u.id,
    email: u.email,
    fullName: u.fullName || 'Unidentified Personnel',
    avatarUrl: u.avatarUrl,
    role: u.adminProfile?.role || 'staff',
    createdAt: u.createdAt,
    lastLogin: u.updatedAt,
    isActive: true
  }))

  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <AdminHeader />
      <main className="flex-1 px-8 py-10">
        <div className="container mx-auto max-w-7xl">
          <StaffManagement staff={transformedStaff} currentUserRole={currentAdmin.role} />
        </div>
      </main>
    </div>
  )
}
