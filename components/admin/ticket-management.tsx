'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  FolderOpen,
  User,
  Calendar,
  AlertTriangle,
  ChevronRight,
  ShieldAlert
} from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from 'date-fns'

interface Ticket {
  id: string
  type: 'product' | 'category'
  itemId: string
  itemName: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
  requester: {
    id: string
    email: string
    fullName?: string
  }
  reviewer?: {
    id: string
    email: string
    fullName?: string
  }
}

interface TicketManagementProps {
  tickets: Ticket[]
}

export function TicketManagement({ tickets: initialTickets }: TicketManagementProps) {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets)
  const [isLoading, setIsLoading] = useState(false)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve')

  const handleReview = (ticket: Ticket, action: 'approve' | 'reject') => {
    setSelectedTicket(ticket)
    setReviewAction(action)
    setReviewDialogOpen(true)
  }

  const handleReviewConfirm = async () => {
    if (!selectedTicket) return
    setIsLoading(true)
    setReviewDialogOpen(false)
    try {
      const response = await fetch(`/api/admin/deletion-tickets/${selectedTicket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: reviewAction })
      })
      if (!response.ok) throw new Error('Action rejected by server')
      toast.success(reviewAction === 'approve' ? 'Asset purged and archived' : 'Destruction request vetoed')
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: reviewAction === 'approve' ? 'approved' : 'rejected' } : t))
      setSelectedTicket(null)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-10">
      {/* Metrics Surface */}
      <div className="grid gap-6 md:grid-cols-3">
        {[
          { label: "Pending Intervention", value: tickets.filter(t => t.status === 'pending').length, color: "text-orange-600", icon: Clock },
          { label: "Total Executions", value: tickets.filter(t => t.status === 'approved').length, color: "text-green-600", icon: CheckCircle },
          { label: "Vetoed Requests", value: tickets.filter(t => t.status === 'rejected').length, color: "text-red-600", icon: XCircle },
        ].map((m, i) => (
          <div key={i} className="bg-white border p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{m.label}</p>
              <h3 className={`text-4xl font-black italic tracking-tighter ${m.color}`}>{m.value}</h3>
            </div>
            <m.icon className={`h-10 w-10 ${m.color} opacity-20`} />
          </div>
        ))}
      </div>

      {/* Governing List */}
      <div className="bg-white border rounded-none overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b bg-muted/30 text-[10px] font-black uppercase tracking-[.2em] text-muted-foreground">
              <th className="px-6 py-4">Node Target</th>
              <th className="px-6 py-4">Proposing Agent</th>
              <th className="px-6 py-4">Rationale</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Intervention</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-muted/10 transition-colors group">
                <td className="px-6 py-6">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 flex items-center justify-center border ${ticket.type === 'product' ? 'border-purple-200 bg-purple-50 text-purple-600' : 'border-blue-200 bg-blue-50 text-blue-600'}`}>
                      {ticket.type === 'product' ? <Package className="h-5 w-5" /> : <FolderOpen className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-black text-sm uppercase tracking-tight">{ticket.itemName}</p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">/{ticket.type}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6 font-medium">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[10px] uppercase font-black tracking-widest">{ticket.requester.fullName || 'Anonymous Agent'}</span>
                  </div>
                </td>
                <td className="px-6 py-6 max-w-xs">
                  <p className="text-xs leading-relaxed italic text-muted-foreground line-clamp-2">"{ticket.reason}"</p>
                </td>
                <td className="px-6 py-6">
                  <Badge variant="outline" className={`rounded-none px-3 text-[9px] font-black uppercase tracking-widest ${ticket.status === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-200' : ticket.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {ticket.status}
                  </Badge>
                </td>
                <td className="px-6 py-6 text-right">
                  {ticket.status === 'pending' ? (
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleReview(ticket, 'approve')}
                        className="h-10 px-4 bg-black text-white text-[9px] font-black uppercase tracking-widest hover:bg-green-600 transition-all"
                      >
                        Execute
                      </button>
                      <button
                        onClick={() => handleReview(ticket, 'reject')}
                        className="h-10 px-4 border border-black text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:border-red-600 hover:text-white transition-all"
                      >
                        Veto
                      </button>
                    </div>
                  ) : (
                    <p className="text-[9px] font-bold uppercase text-muted-foreground">Process finalized</p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {tickets.length === 0 && (
          <div className="py-24 text-center">
            <ShieldAlert className="h-20 w-20 mx-auto mb-6 text-muted-foreground opacity-10" />
            <p className="text-[10px] font-black uppercase tracking-[.3em] text-muted-foreground">Oversight clear: No pending destructive requests</p>
          </div>
        )}
      </div>

      <AlertDialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <AlertDialogContent className="rounded-none border-4 border-black">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black uppercase tracking-tighter text-4xl italic flex items-center gap-3">
              <ShieldAlert className="h-10 w-10 text-red-600" /> Confirm Directive
            </AlertDialogTitle>
            <AlertDialogDescription className="py-6 border-y border-black/5 my-6 text-[11px] font-bold uppercase tracking-widest leading-relaxed">
              {reviewAction === 'approve' ? (
                <>Confirming the absolute destruction of <span className="text-black font-black">"{selectedTicket?.itemName}"</span>. All relational branches and asset associations will be purged from the live cluster.</>
              ) : (
                <>Confirming the veto of this destruction request. The node will remain operative and the request will be archived as rejected.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none h-12 px-8 text-[10px] font-black uppercase tracking-[.25em]">Abort Command</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReviewConfirm}
              className={`rounded-none h-12 px-10 text-[10px] font-black uppercase tracking-[.25em] ${reviewAction === 'approve' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-black text-white hover:bg-black/90'}`}
            >
              Authorize {reviewAction}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
