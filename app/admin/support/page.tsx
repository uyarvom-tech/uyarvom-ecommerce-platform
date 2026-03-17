import { prisma } from "@/lib/prisma"
import { AdminHeader } from "@/components/admin-header"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Filter, MessageSquare, Clock, User, ChevronRight } from "lucide-react"
import { DataTableSearch } from "@/components/admin/data-table-search"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

const statusColors: Record<string, string> = {
    open: "bg-blue-500/10 text-blue-700 border-blue-200",
    resolved: "bg-green-500/10 text-green-700 border-green-200",
    closed: "bg-gray-500/10 text-gray-700 border-gray-200",
}

const priorityColors: Record<string, string> = {
    low: "bg-gray-100 text-gray-600",
    medium: "bg-blue-100 text-blue-600",
    high: "bg-orange-100 text-orange-600",
    urgent: "bg-red-100 text-red-600",
}

export const dynamic = 'force-dynamic'

export default async function adminSupportPage({
    searchParams
}: {
    searchParams: Promise<{ status?: string; search?: string }>
}) {
    const params = await searchParams
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/auth/login?redirect=/admin/support")
    }

    const admin = await prisma.adminUser.findUnique({ where: { userId: user.id } })
    if (!admin) redirect("/")

    const where: any = {}
    if (params.status) where.status = params.status
    if (params.search) {
        where.OR = [
            { ticketNumber: { contains: params.search, mode: 'insensitive' } },
            { subject: { contains: params.search, mode: 'insensitive' } },
        ]
    }

    const tickets = await prisma.supportTicket.findMany({
        where,
        include: {
            customer: true,
            assignedTo: true,
        },
        orderBy: { updatedAt: 'desc' }
    })

    return (
        <div className="flex min-h-screen flex-col bg-muted/20">
            <AdminHeader />
            <main className="flex-1 px-8 py-10">
                <div className="container mx-auto max-w-7xl">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                        <div>
                            <h1 className="text-4xl font-black tracking-tight mb-2 uppercase">Concierge Desk</h1>
                            <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">Manage customer inquiries and support tickets</p>
                        </div>

                        <div className="flex gap-4">
                            <DataTableSearch placeholder="Search Ticket #, Subject..." />
                            <div className="flex items-center gap-2 border bg-white px-3 h-10">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Filter</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-2 mb-8 flex-wrap">
                        <div className="flex gap-2">
                            <Link href="/admin/support">
                                <Badge variant={!params.status ? "default" : "outline"} className="cursor-pointer rounded-none px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest">
                                    All Tickets
                                </Badge>
                            </Link>
                            {['open', 'resolved', 'closed'].map(status => (
                                <Link key={status} href={`/admin/support?status=${status}`}>
                                    <Badge variant={params.status === status ? "default" : "outline"} className="cursor-pointer rounded-none px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest">
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
                                    <th className="px-6 py-4">Ticket</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Last Activity</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-sm">
                                {tickets.map((ticket) => (
                                    <tr key={ticket.id} className="hover:bg-muted/10 transition-colors group">
                                        <td className="px-6 py-6">
                                            <Link href={`/admin/support/${ticket.id}`} className="font-bold hover:underline">
                                                #{ticket.ticketNumber}
                                            </Link>
                                            <p className="font-medium text-black mt-1 line-clamp-1">{ticket.subject}</p>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <p className="font-bold">{ticket.customer.fullName || 'User'}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase">{ticket.customer.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <Badge variant="outline" className="rounded-none text-[9px] uppercase tracking-tighter">
                                                {ticket.category.replace('_', ' ')}
                                            </Badge>
                                            <div className="mt-1 flex items-center gap-1">
                                                <div className={`h-1.5 w-1.5 rounded-full ${priorityColors[ticket.priority].split(' ')[1]}`} />
                                                <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">{ticket.priority}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <Badge variant="outline" className={`rounded-none px-3 text-[10px] font-bold uppercase tracking-widest ${statusColors[ticket.status]}`}>
                                                {ticket.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                <span className="text-xs uppercase font-bold tracking-tighter">
                                                    {new Date(ticket.updatedAt).toLocaleDateString("en-IN")}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <Link href={`/admin/support/${ticket.id}`}>
                                                <button className="p-2 hover:bg-black hover:text-white transition-all">
                                                    <ChevronRight className="h-5 w-5" />
                                                </button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {tickets.length === 0 && (
                            <div className="py-20 text-center">
                                <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">No support tickets found</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
