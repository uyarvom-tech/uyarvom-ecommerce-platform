import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OrderInvoicePrintButton } from "@/components/order-invoice-print-button"

export default async function OrderInvoicePage({ params }: { params: { id: string } }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/auth/login")

    const order = await (prisma as any).order.findUnique({
        where: { id: params.id },
        include: {
            orderItems: true
        }
    })

    if (!order || order.userId !== user.id) notFound()

    return (
        <div className="min-h-screen bg-white p-8 md:p-20 font-serif text-black">
            <div className="mx-auto max-w-4xl border-[3px] border-black p-10 relative overflow-hidden">
                {/* Invoice Watermark */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-35deg] opacity-[0.03] text-[15rem] font-black pointer-events-none uppercase">
                    Paid
                </div>

                <div className="flex justify-between items-start mb-16">
                    <div>
                        <h1 className="text-5xl font-black tracking-tighter uppercase mb-4">Uyarvom</h1>
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">Homestyles Architecture</p>
                    </div>
                    <div className="text-right">
                        <div className="inline-block bg-black text-white px-4 py-1 text-[10px] font-black uppercase tracking-widest mb-4">Official Invoice</div>
                        <p className="text-xs font-bold leading-relaxed">{order.orderNumber}</p>
                        <p className="text-xs opacity-60">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-20 mb-16 border-y border-black/10 py-10">
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[.3em] mb-4 opacity-40">Recipient</h3>
                        <p className="font-bold text-sm uppercase">{order.shippingName}</p>
                        <p className="text-xs leading-relaxed opacity-70 mt-2">
                            {order.shippingAddress1}<br />
                            {order.shippingAddress2 && <>{order.shippingAddress2}<br /></>}
                            {order.shippingCity}, {order.shippingState} {order.shippingZip}
                        </p>
                    </div>
                    <div className="text-right">
                        <h3 className="text-[10px] font-black uppercase tracking-[.3em] mb-4 opacity-40">Method</h3>
                        <p className="font-bold text-sm uppercase">{order.paymentMethod}</p>
                        <p className="text-xs leading-relaxed opacity-70 mt-2 italic capitalize">Status: {order.paymentStatus}</p>
                    </div>
                </div>

                <table className="w-full mb-16">
                    <thead>
                        <tr className="border-b-2 border-black text-[10px] font-black uppercase tracking-widest">
                            <th className="py-4 text-left">Asset Definition</th>
                            <th className="py-4 text-center">Qty</th>
                            <th className="py-4 text-right">Valuation</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                        {order.orderItems.map((item: any) => (
                            <tr key={item.id} className="text-sm">
                                <td className="py-6">
                                    <p className="font-black uppercase">{item.productName}</p>
                                    <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest mt-1">{item.variantName || 'Base Unit'}</p>
                                </td>
                                <td className="py-6 text-center font-bold">0{item.quantity}</td>
                                <td className="py-6 text-right font-black">₹{item.total.toLocaleString("en-IN")}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex justify-end pt-10 border-t border-black">
                    <div className="w-1/2 space-y-4">
                        <div className="flex justify-between text-xs font-bold opacity-40 uppercase tracking-widest">
                            <span>Subtotal</span>
                            <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold opacity-40 uppercase tracking-widest">
                            <span>Logistics</span>
                            <span>₹{order.shipping.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold opacity-40 uppercase tracking-widest">
                            <span>Govt. Tax</span>
                            <span>₹{order.tax.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between text-2xl font-black pt-4 border-t-2 border-black">
                            <span>Total</span>
                            <span>₹{order.total.toLocaleString("en-IN")}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-20 pt-10 border-t border-black/5 flex justify-between items-end">
                    <div className="text-[9px] font-bold uppercase tracking-widest opacity-40 max-w-xs leading-relaxed">
                        This is a computer generated document for Uyarvom Homestyles.
                        Digital certification issued at {new Date().toISOString()}.
                    </div>
                    <OrderInvoicePrintButton />
                </div>
            </div>
        </div>
    )
}
