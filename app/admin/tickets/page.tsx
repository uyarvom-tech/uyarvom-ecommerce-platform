import { prisma } from "@/lib/prisma"
import { AdminHeader } from "@/components/admin-header"
import { TicketManagement } from "@/components/admin/ticket-management"
import { getCurrentUserRole } from "@/lib/auth-middleware"
import { redirect } from "next/navigation"

export default async function TicketsPage() {
  // Get current user role
  const userRole = await getCurrentUserRole()
  
  // Only admins can access ticket management
  if (userRole !== 'super_admin') {
    redirect('/admin/catalog')
  }

  // Fetch all deletion tickets
  const tickets = await prisma.deletionTicket.findMany({
    include: {
      requester: {
        select: {
          id: true,
          email: true,
          fullName: true
        }
      },
      reviewer: {
        select: {
          id: true,
          email: true,
          fullName: true
        }
      }
    },
    orderBy: [
      { status: 'asc' }, // pending first
      { createdAt: 'desc' }
    ]
  })

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AdminHeader />
      
      <main className="flex-1 container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Deletion Requests</h1>
          <p className="text-muted-foreground">
            Review and manage deletion requests from staff members
          </p>
        </div>

        <TicketManagement tickets={tickets} />
      </main>
    </div>
  )
}