"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AccountForm } from "@/components/account-form"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, Plus, Package, MapPin, MessageCircle, User } from "lucide-react"
import Link from "next/link"

const orderStatusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-700",
    confirmed: "bg-blue-500/10 text-blue-700",
    shipped: "bg-indigo-500/10 text-indigo-700",
    delivered: "bg-green-500/10 text-green-700",
    cancelled: "bg-red-500/10 text-red-700",
}

export function AccountTabs({ user, orders, addresses, tickets }: { user: any, orders: any[], addresses: any[], tickets: any[] }) {
    return (
        <Tabs defaultValue="profile" className="w-full">
            <TabsList className="mb-8 bg-transparent border-b rounded-none w-full justify-start h-auto p-0 gap-8 overflow-x-auto scrollbar-hide">
                <TabsTrigger value="profile" className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent px-0 pb-4 text-[10px] font-bold uppercase tracking-widest transition-all">
                    Profile
                </TabsTrigger>
                <TabsTrigger value="orders" className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent px-0 pb-4 text-[10px] font-bold uppercase tracking-widest transition-all">
                    Orders ({orders.length})
                </TabsTrigger>
                <TabsTrigger value="addresses" className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent px-0 pb-4 text-[10px] font-bold uppercase tracking-widest transition-all">
                    Addresses ({addresses.length})
                </TabsTrigger>
                <TabsTrigger value="tickets" className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent px-0 pb-4 text-[10px] font-bold uppercase tracking-widest transition-all">
                    Support ({tickets.length})
                </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="outline-none">
                <div className="grid gap-8 md:grid-cols-2">
                    <AccountForm user={user} />
                    <Card className="rounded-none border-none bg-black text-white p-8">
                        <h3 className="font-playfair text-2xl mb-4 italic">Security & Integrity</h3>
                        <p className="text-gray-400 text-sm leading-relaxed mb-8">
                            Your account is protected by Supabase Auth protocols. For security reasons, sensitive actions like password changes are handled via verified email links.
                        </p>
                        <div className="space-y-4 text-[10px] font-bold uppercase tracking-widest">
                            <div className="flex justify-between border-b border-white/10 pb-4">
                                <span className="text-gray-500">Member ID</span>
                                <span className="font-mono text-[9px]">{user.id.slice(0, 8)}...</span>
                            </div>
                            <div className="flex justify-between border-b border-white/10 pb-4">
                                <span className="text-gray-500">Joined On</span>
                                <span>{new Date(user.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/10 pb-4">
                                <span className="text-gray-500">Tier Status</span>
                                <span className="text-primary tracking-[0.2em]">Collector</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="orders" className="outline-none">
                <div className="space-y-4">
                    {orders.length === 0 ? (
                        <div className="py-20 text-center border-2 border-dashed rounded-none">
                            <Package className="h-10 w-10 mx-auto text-muted-foreground mb-4 opacity-20" />
                            <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">No orders found</p>
                            <Link href="/products" className="text-xs underline mt-4 inline-block font-bold uppercase tracking-widest">Start Shopping</Link>
                        </div>
                    ) : (
                        orders.slice(0, 5).map(order => (
                            <Link key={order.id} href={`/orders/${order.id}`} className="block group">
                                <div className="flex justify-between items-center p-6 border rounded-none group-hover:border-black group-hover:bg-[#F9F7F5] transition-all">
                                    <div className="space-y-1">
                                        <p className="font-bold text-sm tracking-tight">Order #{order.orderNumber}</p>
                                        <p className="text-[10px] text-muted-foreground tracking-widest uppercase font-bold">
                                            {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <p className="font-black text-lg">₹{order.total.toLocaleString("en-IN")}</p>
                                            <Badge variant="outline" className={`${orderStatusColors[order.status]} text-[9px] uppercase tracking-tighter rounded-none border-none py-0 px-0 font-bold bg-transparent`}>
                                                {order.status}
                                            </Badge>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-black transition-all transform group-hover:translate-x-1" />
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                    {orders.length > 5 && (
                        <Link href="/orders" className="block py-6 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-black transition-colors">
                            View All {orders.length} Orders
                        </Link>
                    )}
                </div>
            </TabsContent>

            <TabsContent value="addresses" className="outline-none">
                <div className="grid gap-6 md:grid-cols-2">
                    {addresses.map(address => (
                        <div key={address.id} className="p-8 border border-muted bg-[#FDFCFB] relative group hover:border-black transition-all">
                            {address.isDefault && (
                                <div className="absolute top-0 right-0 bg-black text-white px-3 py-1 text-[8px] font-black uppercase tracking-[0.2em]">
                                    Default
                                </div>
                            )}
                            <div className="space-y-1 mb-6">
                                <p className="font-bold text-base uppercase tracking-tight">{address.fullName}</p>
                                <div className="h-0.5 w-8 bg-black"></div>
                            </div>
                            <div className="text-sm text-muted-foreground leading-relaxed space-y-1">
                                <p>{address.addressLine1}</p>
                                {address.addressLine2 && <p>{address.addressLine2}</p>}
                                <p className="font-medium text-black">{address.city}, {address.state} {address.postalCode}</p>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest mt-6 text-muted-foreground">Phone: {address.phone}</p>
                        </div>
                    ))}
                    <Link href="/checkout" className="border border-dashed p-8 flex flex-col items-center justify-center gap-4 hover:bg-muted/30 transition-all text-muted-foreground hover:text-black">
                        <Plus className="h-8 w-8 opacity-20" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Add New Address</span>
                    </Link>
                </div>
            </TabsContent>

            <TabsContent value="tickets" className="outline-none">
                <div className="space-y-4">
                    {tickets.length === 0 ? (
                        <div className="py-20 text-center border-2 border-dashed rounded-none">
                            <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground mb-4 opacity-20" />
                            <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">No tickets found</p>
                            <Link href="/support" className="text-xs underline mt-4 inline-block font-bold uppercase tracking-widest">Get Support</Link>
                        </div>
                    ) : (
                        tickets.map(ticket => (
                            <div key={ticket.id} className="p-8 border rounded-none flex flex-col md:flex-row justify-between md:items-center gap-6 group hover:border-black transition-all">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-4">
                                        <Badge variant="outline" className="rounded-none text-[8px] font-black uppercase tracking-widest py-1 px-3 border-black">
                                            {ticket.status}
                                        </Badge>
                                        <p className="font-mono text-[10px] text-muted-foreground">{ticket.ticketNumber}</p>
                                    </div>
                                    <p className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{ticket.subject}</p>
                                </div>
                                <div className="flex items-center justify-between md:justify-end gap-12">
                                    <div className="text-right shrink-0">
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Last Update</p>
                                        <p className="text-xs font-bold">{new Date(ticket.updatedAt).toLocaleDateString("en-IN")}</p>
                                    </div>
                                    <Link href={`/support/tickets/${ticket.id}`} className="h-12 w-12 rounded-full border border-muted group-hover:border-black group-hover:bg-black group-hover:text-white flex items-center justify-center transition-all">
                                        <ChevronRight className="h-5 w-5" />
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                    <div className="pt-8 text-center">
                        <Link href="/support" className="text-[10px] font-bold uppercase tracking-[0.3em] underline decoration-muted hover:decoration-black underline-offset-8 transition-all">
                            Open a New Support Ticket
                        </Link>
                    </div>
                </div>
            </TabsContent>
        </Tabs>
    )
}
