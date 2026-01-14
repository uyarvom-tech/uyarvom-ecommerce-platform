import { prisma } from "@/lib/prisma-safe"
import { AdminHeader } from "@/components/admin-header"
import { StaffManagement } from "@/components/admin/staff-management"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function StaffPage() {
  // Check if user is admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Only admins can access staff management (demo auth)
  if (user.email !== 'admin@uyarvom.com') {
    redirect('/admin')
  }

  // Fetch all users for staff management
  const staff = await prisma.user.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Transform data for the component
  const staffWithDetails = staff.map((user: any) => ({
    id: user.id,
    email: user.email,
    fullName: user.fullName || 'No Name',
    avatarUrl: user.avatarUrl,
    role: user.email === 'admin@uyarvom.com' ? 'super_admin' : 'customer',
    permissions: '[]',
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    isActive: true
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
