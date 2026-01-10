import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { redirect } from "next/navigation"

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  confirmed: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  processing: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  shipped: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  delivered: "bg-green-500/10 text-green-700 dark:text-green-400",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
}

export default async function AdminOrdersPage({ searchParams }: { searchParams: { status?: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/admin/orders")
  }

  const { data: adminUser } = await supabase.from("admin_users").select("*").eq("id", user.id).single()

  if (!adminUser) {
    redirect("/")
  }

  let query = supabase
    .from("orders")
    .select(
      `
      *,
      profiles(full_name, email)
    `,
    )
    .order("created_at", { ascending: false })

  if (searchParams.status) {
    query = query.eq("status", searchParams.status)
  }

  const { data: orders } = await query

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AdminHeader />
      <main className="flex-1 px-6 py-8">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold tracking-tight">Orders Management</h1>
            <p className="text-muted-foreground">Manage and track all customer orders</p>
          </div>

          {/* Filters */}
          <div className="mb-6 flex gap-2">
            <Link href="/admin/orders">
              <Badge variant={!searchParams.status ? "default" : "outline"} className="cursor-pointer">
                All
              </Badge>
            </Link>
            <Link href="/admin/orders?status=pending">
              <Badge variant={searchParams.status === "pending" ? "default" : "outline"} className="cursor-pointer">
                Pending
              </Badge>
            </Link>
            <Link href="/admin/orders?status=confirmed">
              <Badge variant={searchParams.status === "confirmed" ? "default" : "outline"} className="cursor-pointer">
                Confirmed
              </Badge>
            </Link>
            <Link href="/admin/orders?status=processing">
              <Badge variant={searchParams.status === "processing" ? "default" : "outline"} className="cursor-pointer">
                Processing
              </Badge>
            </Link>
            <Link href="/admin/orders?status=shipped">
              <Badge variant={searchParams.status === "shipped" ? "default" : "outline"} className="cursor-pointer">
                Shipped
              </Badge>
            </Link>
            <Link href="/admin/orders?status=delivered">
              <Badge variant={searchParams.status === "delivered" ? "default" : "outline"} className="cursor-pointer">
                Delivered
              </Badge>
            </Link>
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            {orders?.map((order: any) => (
              <Link key={order.id} href={`/admin/orders/${order.id}`}>
                <Card className="transition-all hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">Order #{order.order_number}</p>
                          <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Customer: {order.profiles?.full_name || "Guest"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString("en-IN", { dateStyle: "long" })}
                        </p>
                      </div>
                      <div className="text-left md:text-right">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold">₹{Number(order.total).toLocaleString("en-IN")}</p>
                        <p className="text-xs text-muted-foreground capitalize">Payment: {order.payment_status}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
