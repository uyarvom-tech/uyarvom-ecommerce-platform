import { prisma } from "@/lib/prisma"
import { AdminHeader } from "@/components/admin-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImagePlus, Layout, Settings, Trash2, Edit2, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Image from "next/image"

export const dynamic = 'force-dynamic'

export default async function AdminMerchandisingPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/auth/login?redirect=/admin/merchandising")

    const admin = await (prisma as any).adminUser.findUnique({ where: { userId: user.id } })
    if (!admin || admin.role !== 'super_admin') redirect("/admin")

    const banners = await (prisma as any).heroBanner.findMany({
        orderBy: { displayOrder: 'asc' }
    })

    return (
        <div className="flex min-h-screen flex-col bg-muted/20">
            <AdminHeader />
            <main className="flex-1 px-8 py-10">
                <div className="container mx-auto max-w-7xl">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <h1 className="text-4xl font-black tracking-tight mb-2 uppercase">Brand Identity Matrix</h1>
                            <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">Manage homepage visuals and hero merchandising</p>
                        </div>
                        <Button className="bg-black text-white hover:bg-black/90 rounded-none h-12 px-8 text-[10px] font-bold uppercase tracking-widest">
                            <ImagePlus className="mr-2 h-4 w-4" /> Initialize New Banner
                        </Button>
                    </div>

                    <div className="grid gap-8 lg:grid-cols-2">
                        {banners.map((banner: any) => (
                            <Card key={banner.id} className="rounded-none border-none shadow-sm overflow-hidden group">
                                <div className="relative aspect-[21/9] bg-black">
                                    <Image
                                        src={banner.imageUrl}
                                        alt={banner.title}
                                        fill
                                        className="object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                                    />
                                    <div className="absolute inset-x-6 bottom-6">
                                        <Badge className={`mb-3 rounded-none px-3 text-[9px] font-black uppercase tracking-widest ${banner.isActive ? 'bg-green-600' : 'bg-red-600'}`}>
                                            {banner.isActive ? 'Operational' : 'Offline'}
                                        </Badge>
                                        <h3 className="text-white font-playfair text-2xl font-black mb-1">{banner.title}</h3>
                                        <p className="text-white/70 text-[10px] uppercase tracking-widest font-bold truncate">{banner.subtitle}</p>
                                    </div>
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="h-8 w-8 bg-white text-black flex items-center justify-center hover:bg-primary transition-colors">
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button className="h-8 w-8 bg-white text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                <CardContent className="p-6 bg-white border-t">
                                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground">
                                        <div className="flex items-center gap-4">
                                            <span>Sequence: 0{banner.displayOrder}</span>
                                            {banner.linkUrl && <span>Dest: {banner.linkUrl}</span>}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {banners.length === 0 && (
                            <Card className="lg:col-span-2 border-2 border-dashed border-muted bg-white/50 p-20 flex flex-col items-center justify-center text-center">
                                <Layout className="h-10 w-10 text-muted-foreground mb-4 opacity-20" />
                                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">No active hero banners detected in the matrix</p>
                                <Button className="mt-6 bg-black text-white px-8 h-10 text-[10px] items-center gap-2">
                                    <Plus className="h-4 w-4" /> Construct Primary Banner
                                </Button>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}

function Plus({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14" /><path d="M12 5v14" /></svg>
    )
}
