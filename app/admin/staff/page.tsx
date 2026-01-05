import { prisma } from "@/lib/prisma"
import { AdminHeader } from "@/components/admin-header"
import { StaffManagement } from "@/components/admin/staff-management"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function StaffPage() {
  // Check if user is admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Get user's admin role
  const adminUser = await prisma.user.findUnique({
    where: { email: user.email! },
    include: { adminUser: true }
  })

  // Only admins can access staff management
  if (!adminUser?.adminUser || adminUser.adminUser.role !== 'admin') {
    redirect('/admin') // Redirect staff to main admin page
  }

  // Fetch all staff members (users with admin roles)
  const staff = await prisma.user.findMany({
    where: {
      adminUser: {
        isNot: null
      }
    },
    include: {
      adminUser: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Transform data for the component
  const staffWithDetails = staff.map(user => ({
    id: user.id,
    email: user.email,
    fullName: user.fullName || 'No Name',
    avatarUrl: user.avatarUrl,
    role: user.adminUser?.role || 'staff',
    permissions: user.adminUser?.permissions || '[]',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    isActive: true // We'll add this field later if needed
  }))

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AdminHeader />
      
      <main className="flex-1 container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground">
            Create and manage staff accounts with role-based permissions
          </p>
        </div>

        <StaffManagement staff={staffWithDetails} />
      </main>
    </div>
  )
}