import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { notFound, redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { SupportReplyForm } from "@/components/support-reply-form"
import { Clock, User as UserIcon, Shield, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/auth/login?redirect=/support")
    }

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
            order: true,
        },
    })

    if (!ticket || ticket.userId !== user.id) {
        // Check if admin
        const admin = await prisma.adminUser.findUnique({ where: { userId: user.id } })
        if (!admin) notFound()
    }

    if (!ticket) notFound()

    const statusColors: Record<string, string> = {
        open: "bg-blue-500 text-white",
        resolved: "bg-green-500 text-white",
        closed: "bg-gray-500 text-white",
    }

    return (
        <div className="flex min-h-screen flex-col bg-[#FDFCFB]">
            <Header />
            <main className="flex-1 px-6 py-12">
                <div className="container mx-auto max-w-4xl">
                    <Link href="/account" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.25em] text-muted-foreground hover:text-black mb-10 transition-colors">
                        <ArrowLeft className="h-3 w-3" /> Back to Dashboard
                    </Link>

                    <div className="mb-12 border-b border-black/5 pb-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                            <div>
                                <Badge variant="outline" className="mb-3 border-black px-3 py-1 rounded-none text-[9px] font-black uppercase tracking-widest">
                                    {ticket.category.replace("_", " ")}
                                </Badge>
                                <h1 className="font-playfair text-4xl md:text-5xl font-black tracking-tight">{ticket.subject}</h1>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <Badge className={`${statusColors[ticket.status] || 'bg-black'} rounded-none px-4 py-1 text-[10px] font-black uppercase tracking-widest`}>
                                    {ticket.status}
                                </Badge>
                                <p className="font-mono text-[10px] text-muted-foreground">#{ticket.ticketNumber}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            <span className="flex items-center gap-2"><Clock className="h-3 w-3" /> Opened {new Date(ticket.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                            {ticket.order && (
                                <Link href={`/orders/${ticket.order.id}`} className="underline hover:text-black">
                                    Related Order: #{ticket.order.orderNumber}
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="space-y-10 mb-16">
                        {ticket.messages.map((msg: any) => {
                            const isAdmin = msg.sender.adminProfile !== null
                            return (
                                <div key={msg.id} className={`flex gap-6 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`h-12 w-12 rounded-none flex items-center justify-center shrink-0 ${isAdmin ? 'bg-black text-white' : 'bg-muted text-muted-foreground shadow-inner'}`}>
                                        {isAdmin ? <Shield className="h-6 w-6" /> : <UserIcon className="h-6 w-6" />}
                                    </div>
                                    <div className={`flex-1 p-8 rounded-none border ${isAdmin ? 'bg-[#F9F7F5] border-transparent shadow-sm' : 'bg-white border-muted'}`}>
                                        <div className="flex justify-between items-center mb-4 border-b border-black/5 pb-4">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest mb-1">{isAdmin ? 'Uyarvom Concierge' : msg.sender.fullName}</p>
                                                {isAdmin && <p className="text-[8px] text-primary font-bold uppercase tracking-widest">Official Response</p>}
                                            </div>
                                            <time className="text-[9px] font-bold text-muted-foreground uppercase">{new Date(msg.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</time>
                                        </div>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800">{msg.body}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {ticket.status !== 'closed' ? (
                        <div className="bg-white border border-muted p-10 rounded-none shadow-sm">
                            <h3 className="font-playfair text-2xl font-bold mb-6">Send a Message</h3>
                            <SupportReplyForm ticketId={ticket.id} />
                        </div>
                    ) : (
                        <div className="p-10 bg-muted/30 text-center border border-dashed rounded-none">
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">This ticket has been closed.</p>
                            <Link href="/support" className="inline-block mt-4 text-xs underline font-bold uppercase tracking-widest">Need more help? Open a new ticket</Link>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    )
}
