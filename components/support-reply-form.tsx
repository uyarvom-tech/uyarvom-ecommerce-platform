"use client"

import { useState } from "react"
import { replyToTicket } from "@/lib/actions/support"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

export function SupportReplyForm({ ticketId }: { ticketId: string }) {
    const [message, setMessage] = useState("")
    const [isPending, setIsPending] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!message.trim()) {
            toast.error("Please enter a message.")
            return
        }

        setIsPending(true)
        const res = await replyToTicket(ticketId, message)
        setIsPending(false)

        if (res.success) {
            toast.success("Reply sent successfully")
            setMessage("")
        } else {
            toast.error(res.error)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
                required
                placeholder="Type your message to support..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="rounded-none border-muted focus-visible:ring-black resize-none"
            />
            <div className="flex justify-end">
                <Button
                    type="submit"
                    disabled={isPending || !message.trim()}
                    className="bg-black text-white rounded-none h-12 px-12 text-[10px] font-bold uppercase tracking-widest hover:bg-black/90 transition-all"
                >
                    {isPending ? "Sending..." : "Send Message"}
                </Button>
            </div>
        </form>
    )
}
