import { redirect } from 'next/navigation'
import { getCurrentUserContext } from '@/lib/auth-middleware'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if user has admin/staff access
  const context = await getCurrentUserContext()

  if (!context || !['admin', 'staff', 'super_admin'].includes(context.role)) {
    // Redirect to the correct admin login page
    redirect('/auth/admin-login?message=Admin access required')
  }

  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}
