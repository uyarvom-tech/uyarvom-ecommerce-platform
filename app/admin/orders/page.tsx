import { prisma } from "@/lib/prisma"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Filter, MoreHorizontal, ChevronRight } from "lucide-react"
import { DataTableSearch } from "@/components/admin/data-table-search"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  confirmed: "bg-blue-500/10 text-blue-700 border-blue-200",
  processing: "bg-purple-500/10 text-purple-700 border-purple-200",
  shipped: "bg-indigo-500/10 text-indigo-700 border-indigo-200",
  delivered: "bg-green-500/10 text-green-700 border-green-200",
  cancelled: "bg-red-500/10 text-red-700 border-red-200",
}

export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; search?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/admin/orders")
  }

  const admin = await prisma.adminUser.findUnique({ where: { userId: user.id } })
  if (!admin) redirect("/")

  const where: any = {}
  if (params.status) where.status = params.status
  if (params.search) {
    where.OR = [
      { orderNumber: { contains: params.search, mode: 'insensitive' } },
      { shippingName: { contains: params.search, mode: 'insensitive' } },
      { shippingEmail: { contains: params.search, mode: 'insensitive' } },
    ]
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      user: true,
      _count: { select: { orderItems: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <AdminHeader />
      <main className="flex-1 px-8 py-10">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <h1 className="text-4xl font-black tracking-tight mb-2 uppercase">Order Command</h1>
              <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">Monitor and fulfill customer desires</p>
            </div>

            <div className="flex gap-4">
              <DataTableSearch placeholder="Search Order #, Name..." />
              <div className="flex items-center gap-2 border bg-white px-3 h-10">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Filter</span>
              </div>
            </div>
          </div>

          <div className="grid gap-2 mb-8 flex-wrap">
            <div className="flex gap-2">
              <Link href="/admin/orders">
                <Badge variant={!params.status ? "default" : "outline"} className="cursor-pointer rounded-none px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest">
                  All Activity
                </Badge>
              </Link>
              {Object.keys(statusColors).map(status => (
                <Link key={status} href={`/admin/orders?status=${status}`}>
                  <Badge variant={params.status === status ? "default" : "outline"} className="cursor-pointer rounded-none px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full ${statusColors[status].split(' ')[1]}`} />
                    {status}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white border rounded-none shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-muted/30 text-[10px] font-black uppercase tracking-[.2em] text-muted-foreground">
                  <th className="px-6 py-4">Order Details</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4">Fulfillment</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {(orders as any[]).map((order) => (
                  <tr key={order.id} className="hover:bg-muted/10 transition-colors group">
                    <td className="px-6 py-6">
                      <Link href={`/admin/orders/${order.id}`} className="font-bold hover:underline">
                        #{order.orderNumber}
                      </Link>
                      <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-widest">
                        {new Date(order.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </td>
                    <td className="px-6 py-6">
                      <p className="font-bold">{order.shippingName}</p>
                      <p className="text-xs text-muted-foreground">{order.shippingEmail}</p>
                    </td>
                    <td className="px-6 py-6 font-mono text-xs">
                      <Badge variant="outline" className={`rounded-none text-[9px] uppercase tracking-tighter ${order.paymentStatus === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                        {order.paymentStatus}
                      </Badge>
                      <p className="mt-1 text-muted-foreground opacity-60">{order.paymentMethod.replace('_', ' ')}</p>
                    </td>
                    <td className="px-6 py-6">
                      <Badge variant="outline" className={`rounded-none px-3 text-[10px] font-bold uppercase tracking-widest ${statusColors[order.status]}`}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <p className="text-base font-black italic">₹{order.total.toLocaleString("en-IN")}</p>
                      <p className="text-[10px] text-muted-foreground">{order._count.orderItems} items</p>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <Link href={`/admin/orders/${order.id}`}>
                        <button className="p-2 hover:bg-black hover:text-white transition-all">
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {orders.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">No orders match the criteria</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
