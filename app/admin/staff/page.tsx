import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "@/components/admin-header"
import { StaffManagement } from "@/components/admin/staff-management"
import { redirect } from "next/navigation"

export default async function AdminStaffPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/admin/staff")
  }

  // Temporary: Allow any logged-in user to access admin
  const { data: adminUser } = await supabase.from("admin_users").select("*").eq("id", user.id).single()
  
  // For now, create a temporary admin user object if none exists
  const currentAdmin = adminUser || {
    id: user.id,
    role: 'super_admin', // Give super_admin access for testing
    permissions: ['all'],
    created_at: new Date().toISOString()
  }

  // Temporary: Comment out role restriction for testing
  // if (currentAdmin.role !== 'super_admin') {
  //   redirect("/admin")
  // }

  const { data: staffMembers } = await supabase
    .from("admin_users")
    .select(`
      *,
      profiles:profiles(full_name, email, avatar_url)
    `)
    .order("created_at", { ascending: false })

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AdminHeader />
      <main className="flex-1 px-6 py-8">
        <div className="container mx-auto max-w-7xl">
          <StaffManagement staffMembers={staffMembers || []} currentUser={currentAdmin} />
        </div>
      </main>
    </div>
  )
}