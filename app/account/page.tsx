import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { syncAuthUserToPrisma } from "@/lib/user-sync"
import { prisma } from "@/lib/prisma"
import { AccountTabs } from "@/components/account-tabs"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect("/auth/login?redirect=/account")
  }

  // Ensure user exists in Prisma and get all related data
  const user = await syncAuthUserToPrisma(authUser)

  const [orders, addresses, tickets] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    }),
    prisma.address.findMany({
      where: { userId: user.id },
      orderBy: { isDefault: 'desc' }
    }),
    prisma.supportTicket.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' }
    })
  ])

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFCFB]">
      <Header />
      <main className="flex-1">
        {/* Account Hero */}
        <div className="bg-black text-white py-20">
          <div className="container mx-auto max-w-6xl px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <Badge variant="outline" className="mb-4 border-white/50 text-white px-4 py-1 rounded-none text-[8px] font-black uppercase tracking-[.25em]">
                  Account Dashboard
                </Badge>
                <h1 className="text-white font-playfair text-6xl font-black tracking-tight">{user.fullName || "User"}</h1>
                <p className="mt-4 text-white/70 font-medium uppercase tracking-[.25em] text-[10px]">{user.email}</p>
              </div>
              <div className="flex gap-4">
                <div className="text-right border-l border-white/20 pl-6">
                  <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest mb-1">Orders</p>
                  <p className="text-3xl font-black text-white">{orders.length}</p>
                </div>
                <div className="text-right border-l border-white/20 pl-6">
                  <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest mb-1">Tickets</p>
                  <p className="text-3xl font-black text-white">{tickets.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Tabs Section */}
        <div className="container mx-auto max-w-6xl px-6 py-16">
          <AccountTabs
            user={user}
            orders={orders}
            addresses={addresses}
            tickets={tickets}
          />
        </div>
      </main>
      <Footer />
    </div>
  )
}
