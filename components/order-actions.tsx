"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { requestCancellation, requestReturn } from "@/lib/actions/orders"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { FileText } from "lucide-react"

export function OrderActions({ order, returnWindow = 7 }: { order: any, returnWindow?: number }) {
    const [isPending, setIsPending] = useState(false)
    const [reason, setReason] = useState("")
    const [isOpen, setIsOpen] = useState(false)

    const canCancel = ["pending", "confirmed"].includes(order.status)
    // Dynamic return window logic
    const deliveredAt = order.deliveredAt || order.updatedAt
    const daysSinceDelivery = (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24)
    const canReturn = order.status === "delivered" && order.returnStatus === "none" && daysSinceDelivery <= returnWindow

    // We always want to show the invoice, so we don't return null anymore if canCancel/canReturn are false

    const handleSubmit = async () => {
        if (!reason.trim()) {
            toast.error("Please provide a reason")
            return
        }

        setIsPending(true)
        const res = canCancel
            ? await requestCancellation(order.id, reason)
            : await requestReturn(order.id, reason)

        setIsPending(false)

        if (res.success) {
            toast.success(canCancel ? "Order cancelled" : "Return requested")
            setIsOpen(false)
            setReason("")
        } else {
            toast.error(res.error)
        }
    }

    return (
        <div className="flex flex-col gap-2">
            <Button variant="outline" className="w-full border-primary/20 hover:bg-primary/5 rounded-none" asChild>
                <Link href={`/orders/${order.id}/invoice`} target="_blank">
                    <FileText className="mr-2 h-4 w-4" /> View Invoice
                </Link>
            </Button>

            {(canCancel || canReturn) && (
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-none">
                            {canCancel ? "Cancel Order" : "Request Return"}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{canCancel ? "Cancel Order" : "Request Return"}</DialogTitle>
                            <DialogDescription>
                                {canCancel
                                    ? "Are you sure you want to cancel this order? Stock will be restored and your refund (if any) will be processed as per policy."
                                    : "Please tell us why you want to return this order. Our team will review your request."}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Textarea
                                placeholder="Please enter the reason here..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={4}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsOpen(false)} className="bg-transparent">Close</Button>
                            <Button
                                variant="destructive"
                                onClick={handleSubmit}
                                disabled={isPending || !reason.trim()}
                            >
                                {isPending ? "Processing..." : (canCancel ? "Confirm Cancellation" : "Submit Return Request")}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}
