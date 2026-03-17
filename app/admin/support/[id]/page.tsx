import { prisma } from "@/lib/prisma"
import { AdminHeader } from "@/components/admin-header"
import { Badge } from "@/components/ui/badge"
import { SupportReplyForm } from "@/components/support-reply-form"
import { SupportActions } from "@/components/admin/support-actions"
import { Clock, User as UserIcon, Shield, ArrowLeft, MoreHorizontal, CheckCircle } from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function AdminTicketDetailPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/auth/login?redirect=/admin/support")
    }

    const admin = await prisma.adminUser.findUnique({ where: { userId: user.id } })
    if (!admin) redirect("/")

    const ticket = await prisma.supportTicket.findUnique({
        where: { id: params.id },
        include: {
            messages: {
                include: {
                    sender: {
                        include: {
                            adminProfile: true
                        }
                    },
                },
                orderBy: { createdAt: "asc" },
            },
            customer: true,
            order: true,
            assignedTo: true,
        },
    }) as any

    if (!ticket) notFound()

    const statusColors: Record<string, string> = {
        open: "bg-blue-500 text-white",
        resolved: "bg-green-500 text-white",
        closed: "bg-gray-500 text-white",
    }

    return (
        <div className="flex min-h-screen flex-col bg-muted/5">
            <AdminHeader />
            <main className="flex-1 px-8 py-10">
                <div className="container mx-auto max-w-5xl">
                    <Link href="/admin/support" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.25em] text-muted-foreground hover:text-black mb-10 transition-colors">
                        <ArrowLeft className="h-3 w-3" /> Back to Concierge
                    </Link>

                    <div className="grid gap-10 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            <div className="mb-12 border-b border-black/5 pb-10">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                    <div>
                                        <Badge variant="outline" className="mb-3 border-black px-3 py-1 rounded-none text-[9px] font-black uppercase tracking-widest">
                                            {ticket.category.replace("_", " ")}
                                        </Badge>
                                        <h1 className="font-playfair text-4xl font-black tracking-tight">{ticket.subject}</h1>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <Badge className={`${statusColors[ticket.status] || 'bg-black'} rounded-none px-4 py-1.5 text-[10px] font-black uppercase tracking-widest`}>
                                            {ticket.status}
                                        </Badge>
                                        <p className="font-mono text-[10px] text-muted-foreground">#{ticket.ticketNumber}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-10 mb-16">
                                {ticket.messages.map((msg: any) => {
                                    const isAdminMsg = msg.sender.adminProfile !== null
                                    return (
                                        <div key={msg.id} className={`flex gap-6 ${isAdminMsg ? 'flex-row-reverse text-right' : 'flex-row'}`}>
                                            <div className={`h-12 w-12 rounded-none flex items-center justify-center shrink-0 shadow-sm ${isAdminMsg ? 'bg-black text-white' : 'bg-white text-muted-foreground border'}`}>
                                                {isAdminMsg ? <Shield className="h-6 w-6" /> : <UserIcon className="h-6 w-6" />}
                                            </div>
                                            <div className={`flex-1 p-8 rounded-none border ${isAdminMsg ? 'bg-[#F9F7F5] border-transparent' : 'bg-white border-muted'}`}>
                                                <div className={`flex justify-between items-center mb-4 border-b border-black/5 pb-4 ${isAdminMsg ? 'flex-row-reverse' : ''}`}>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest mb-1">{isAdminMsg ? 'Uyarvom Concierge' : msg.sender.fullName}</p>
                                                        {isAdminMsg && <p className="text-[8px] text-primary font-bold uppercase tracking-widest">Official Response</p>}
                                                    </div>
                                                    <time className="text-[9px] font-bold text-muted-foreground uppercase">{new Date(msg.createdAt).toLocaleString("en-IN")}</time>
                                                </div>
                                                <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isAdminMsg ? 'text-gray-800' : 'text-gray-900'}`}>{msg.body}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {ticket.status !== 'closed' && (
                                <div className="bg-white border border-muted p-10 rounded-none shadow-sm">
                                    <h3 className="font-playfair text-2xl font-bold mb-6 italic">Compose Response</h3>
                                    <SupportReplyForm ticketId={ticket.id} />
                                </div>
                            )}
                        </div>

                        <div className="space-y-10">
                            <Card className="rounded-none border-none shadow-sm overflow-hidden">
                                <div className="bg-black text-white p-6">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                        <MoreHorizontal className="h-4 w-4" /> Ticket Metadata
                                    </h3>
                                </div>
                                <CardContent className="p-8 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Priority</p>
                                            <Badge variant="outline" className="rounded-none text-[10px] font-bold uppercase">{ticket.priority}</Badge>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Source</p>
                                            <span className="text-xs font-bold uppercase">{ticket.source}</span>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t">
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Assigned To</p>
                                        {ticket.assignedTo ? (
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 bg-primary rounded-full flex items-center justify-center shrink-0">
                                                    <Shield className="h-3 w-3 text-black" />
                                                </div>
                                                <p className="text-xs font-bold uppercase">{ticket.assignedTo.fullName || 'Support Agent'}</p>
                                            </div>
                                        ) : (
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 italic">Unassigned</p>
                                        )}
                                    </div>

                                    {ticket.order && (
                                        <div className="pt-6 border-t whitespace-nowrap">
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Related Order</p>
                                            <Link href={`/admin/orders/${ticket.order.id}`} className="flex items-center gap-3 group">
                                                <Badge className="bg-black text-white rounded-none group-hover:bg-primary transition-colors">#{ticket.order.orderNumber}</Badge>
                                                <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">View Details</span>
                                            </Link>
                                        </div>
                                    )}

                                    <SupportActions
                                        ticketId={ticket.id}
                                        isAssigned={!!ticket.assignedToId}
                                        status={ticket.status}
                                    />
                                </CardContent>
                            </Card>

                            <Card className="rounded-none border-none shadow-sm">
                                <CardHeader className="border-b bg-muted/5 py-6">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                        <UserIcon className="h-4 w-4" /> Customer Profile
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <p className="font-bold text-lg mb-1">{ticket.customer.fullName || 'User'}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">{ticket.customer.email}</p>
                                    <Link href={`/admin/users/${ticket.userId}`} className="text-[10px] font-bold uppercase tracking-widest underline decoration-muted hover:decoration-black transition-all">
                                        View User History
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
