import { prisma } from "@/lib/prisma"
import { AdminHeader } from "@/components/admin-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, ShieldCheck, CreditCard, Truck, Percent, RefreshCcw, Mail, CalendarDays } from "lucide-react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SettingForm } from "@/components/admin/setting-form"

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/auth/login?redirect=/admin/settings")

    const admin = await (prisma as any).adminUser.findUnique({ where: { userId: user.id } })
    if (!admin || admin.role !== 'super_admin') redirect("/admin")

    const settings = await (prisma as any).systemSetting.findMany()

    // Group settings for UI
    const financial = settings.filter((s: any) => s.group === 'financial' || ['tax_rate', 'shipping_threshold', 'cod_limit'].includes(s.key))
    const storefront = settings.filter((s: any) => s.group === 'storefront')

    return (
        <div className="flex min-h-screen flex-col bg-muted/20">
            <AdminHeader />
            <main className="flex-1 px-8 py-10">
                <div className="container mx-auto max-w-5xl">
                    <div className="mb-12">
                        <h1 className="text-4xl font-black tracking-tight mb-2 uppercase flex items-center gap-4">
                            Operational Parameters
                            <Badge variant="outline" className="border-black text-black px-3 py-1 rounded-none text-[9px] font-black uppercase tracking-widest">
                                Critical Access
                            </Badge>
                        </h1>
                        <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">Global configuration for finances, logistics, and store behavior</p>
                    </div>

                    <div className="grid gap-10">
                        {/* Financial Settings */}
                        <Card className="rounded-none border-none shadow-sm">
                            <CardHeader className="bg-black text-white py-6">
                                <CardTitle className="text-xs font-black uppercase tracking-[.3em] flex items-center gap-3">
                                    <CreditCard className="h-4 w-4 text-primary" /> Financial Architecture
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-10">
                                <div className="grid gap-12 md:grid-cols-2">
                                    <div className="space-y-8">
                                        <SettingForm
                                            label="GST / Tax Rate (%)"
                                            name="tax_rate"
                                            defaultValue={settings.find((s: any) => s.key === "tax_rate")?.value || "18"}
                                            description="Standard Goods and Services Tax applied to all domestic orders."
                                            icon={<Percent className="h-4 w-4" />}
                                        />
                                        <SettingForm
                                            label="Free Shipping Threshold (₹)"
                                            name="shipping_threshold"
                                            defaultValue={settings.find((s: any) => s.key === "shipping_threshold")?.value || "999"}
                                            description="Minimum order value to qualify for complimentary logistics."
                                            icon={<Truck className="h-4 w-4" />}
                                        />
                                    </div>
                                    <div className="space-y-8">
                                        <SettingForm
                                            label="COD Upper Limit (₹)"
                                            name="cod_limit"
                                            defaultValue={settings.find((s: any) => s.key === "cod_limit")?.value || "10000"}
                                            description="Maximum transaction value allowed for Cash on Delivery."
                                            icon={<ShieldCheck className="h-4 w-4" />}
                                        />
                                        <SettingForm
                                            label="Standard Shipping Fee (₹)"
                                            name="shipping_fee"
                                            defaultValue={settings.find((s: any) => s.key === "shipping_fee")?.value || "50"}
                                            description="Base logistics cost for orders below the threshold."
                                            icon={<Truck className="h-4 w-4" />}
                                        />
                                    </div>
                                    <div className="space-y-8">
                                        <SettingForm
                                            label="Return Window (Days)"
                                            name="return_window"
                                            defaultValue={settings.find((s: any) => s.key === "return_window")?.value || "7"}
                                            description="Number of days a customer has to request a return after delivery."
                                            icon={<CalendarDays className="h-4 w-4" />}
                                        />
                                        <SettingForm
                                            label="Support Contact Email"
                                            name="support_email"
                                            defaultValue={settings.find((s: any) => s.key === "support_email")?.value || "support@uyarvom.com"}
                                            description="Public email address for customer support inquiries."
                                            icon={<Mail className="h-4 w-4" />}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* System Health */}
                        <div className="flex items-center justify-between p-8 bg-black text-white">
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-[.25em] mb-1">Cache Synchronizer</h3>
                                <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Force revalidation of all global store states</p>
                            </div>
                            <Button variant="outline" className="border-white/20 text-white rounded-none h-10 px-8 text-[9px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                                <RefreshCcw className="mr-2 h-3 w-3" /> Re-index Matrix
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
