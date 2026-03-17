"use client"

import { useState } from "react"
import { createTicket } from "@/lib/actions/support"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function SupportForm({ orders }: { orders?: any[] }) {
    const [formData, setFormData] = useState({
        subject: "",
        category: "general",
        orderId: "",
        message: ""
    })
    const [isPending, setIsPending] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.subject.trim() || !formData.message.trim()) {
            toast.error("Please fill in all required fields.")
            return
        }

        setIsPending(true)
        const res = await createTicket(formData)
        setIsPending(false)

        if (res.success) {
            toast.success("Support ticket created! Check your account for updates.")
            setFormData({ subject: "", category: "general", orderId: "", message: "" })
        } else {
            toast.error(res.error)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">
                        Help Category
                    </label>
                    <Select
                        value={formData.category}
                        onValueChange={(v) => setFormData({ ...formData, category: v, orderId: v !== "order_issue" ? "" : formData.orderId })}
                    >
                        <SelectTrigger className="rounded-none border-muted">
                            <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                            <SelectItem value="general">General Question</SelectItem>
                            <SelectItem value="order_issue">Order Issue</SelectItem>
                            <SelectItem value="delivery">Delivery Problem</SelectItem>
                            <SelectItem value="return">Return / Exchange</SelectItem>
                            <SelectItem value="payment">Payment Issue</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {formData.category === "order_issue" && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">
                            Related Order
                        </label>
                        <Select
                            value={formData.orderId}
                            onValueChange={(v) => setFormData({ ...formData, orderId: v })}
                        >
                            <SelectTrigger className="rounded-none border-muted">
                                <SelectValue placeholder="Select Order" />
                            </SelectTrigger>
                            <SelectContent className="rounded-none">
                                {orders && orders.length > 0 ? (
                                    orders.map(o => (
                                        <SelectItem key={o.id} value={o.id}>Order #{o.orderNumber}</SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="none" disabled>No recent orders found</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">
                    Subject
                </label>
                <Input
                    required
                    placeholder="Summarize your issue"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="rounded-none border-muted focus-visible:ring-black"
                />
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">
                    Details
                </label>
                <Textarea
                    required
                    placeholder="Tell us more so we can help you better..."
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="rounded-none border-muted focus-visible:ring-black resize-none"
                />
            </div>

            <Button
                type="submit"
                className="w-full bg-black text-white hover:bg-black/90 rounded-none h-12 text-xs font-bold uppercase tracking-widest"
                disabled={isPending}
            >
                {isPending ? "Submitting..." : "Create Support Ticket"}
            </Button>
        </form>
    )
}
