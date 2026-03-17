'use client'

import { useState } from 'react'
import { assignTicket, updateTicketStatus } from '@/lib/actions/admin-support'
import { toast } from 'sonner'
import { CheckCircle, Shield } from 'lucide-react'

interface SupportActionsProps {
    ticketId: string
    isAssigned: boolean
    status: string
}

export function SupportActions({ ticketId, isAssigned, status }: SupportActionsProps) {
    const [isLoading, setIsLoading] = useState(false)

    const handleAssign = async () => {
        setIsLoading(true)
        const res = await assignTicket(ticketId)
        setIsLoading(false)
        if (res.success) toast.success("Ticket assigned to your station")
        else toast.error(res.error)
    }

    const handleStatusUpdate = async (newStatus: string) => {
        setIsLoading(true)
        const res = await updateTicketStatus(ticketId, newStatus)
        setIsLoading(false)
        if (res.success) toast.success(`Ticket status established as ${newStatus}`)
        else toast.error(res.error)
    }

    return (
        <div className="pt-10 space-y-3">
            {!isAssigned && (
                <button
                    onClick={handleAssign}
                    disabled={isLoading}
                    className="w-full h-11 border border-black text-black text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors mb-4"
                >
                    Assign To Me
                </button>
            )}

            {status !== 'resolved' && (
                <button
                    onClick={() => handleStatusUpdate('resolved')}
                    disabled={isLoading}
                    className="w-full h-11 bg-green-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                    <CheckCircle className="h-4 w-4" /> Resolve Ticket
                </button>
            )}

            {status !== 'closed' && (
                <button
                    onClick={() => handleStatusUpdate('closed')}
                    disabled={isLoading}
                    className="w-full h-11 border border-black text-black text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
                >
                    Close Ticket
                </button>
            )}

            {status === 'closed' && (
                <button
                    onClick={() => handleStatusUpdate('open')}
                    disabled={isLoading}
                    className="w-full h-11 border border-black text-black text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
                >
                    Re-Open Ticket
                </button>
            )}
        </div>
    )
}
