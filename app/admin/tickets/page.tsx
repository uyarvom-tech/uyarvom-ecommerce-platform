import { prisma } from "@/lib/prisma"
import { AdminHeader } from "@/components/admin-header"
import { TicketManagement } from "@/components/admin/ticket-management"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function TicketsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login?redirect=/admin/tickets")

  const admin = await prisma.adminUser.findUnique({ where: { userId: user.id } })

  // High-level governance: Only super_admin can review deletion tickets
  if (!admin || admin.role !== 'super_admin') {
    redirect('/admin/catalog')
  }

  const tickets = await prisma.deletionTicket.findMany({
    include: {
      requester: true,
      reviewer: true
    },
    orderBy: { createdAt: 'desc' }
  })

  const transformedTickets = tickets.map((t: any) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }))

  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <AdminHeader />
      <main className="flex-1 px-8 py-10">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h1 className="text-5xl font-black tracking-tighter uppercase mb-2 text-red-600 italic">Governance Log</h1>
              <p className="text-muted-foreground text-sm font-bold uppercase tracking-[.3em]">Reviewing destructive operational requests</p>
            </div>
            <div className="bg-black text-white px-6 py-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Critical Oversight Mode
            </div>
          </div>

          <TicketManagement tickets={transformedTickets} />
        </div>
      </main>
    </div>
  )
}
