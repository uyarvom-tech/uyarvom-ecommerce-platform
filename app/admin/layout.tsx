import { redirect } from 'next/navigation'
import { checkAdminAccess } from '@/lib/auth-middleware'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if user has admin access
  const hasAdminAccess = await checkAdminAccess()

  if (!hasAdminAccess) {
    // Redirect to login page if no admin access
    redirect('/auth/signin?message=Admin access required')
  }

  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}