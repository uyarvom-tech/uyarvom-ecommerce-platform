'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Calendar
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

  // Filter tickets by status
  const pendingTickets = tickets.filter(t => t.status === 'pending')
  const approvedTickets = tickets.filter(t => t.status === 'approved')
  const rejectedTickets = tickets.filter(t => t.status === 'rejected')

  // Handle ticket review
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

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to review ticket')
      }

      const result = await response.json()
      toast.success(result.message)

      // Update ticket in state
      setTickets(prev => prev.map(t => 
        t.id === selectedTicket.id 
          ? { ...t, status: reviewAction === 'approve' ? 'approved' : 'rejected' }
          : t
      ))

      setSelectedTicket(null)
    } catch (error: any) {
      console.error('Review error:', error)
      toast.error(error.message || 'Failed to review ticket')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-600" />
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Pending</Badge>
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    return type === 'product' ? <Package className="h-4 w-4" /> : <FolderOpen className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-orange-600" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Pending Review</p>
                <p className="text-2xl font-bold">{pendingTickets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Approved</p>
                <p className="text-2xl font-bold">{approvedTickets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-4 w-4 text-red-600" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Rejected</p>
                <p className="text-2xl font-bold">{rejectedTickets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>Deletion Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length > 0 ? (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div 
                  key={ticket.id} 
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ticket.status)}
                        {getTypeIcon(ticket.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-base truncate">
                            {ticket.itemName}
                          </h3>
                          {getStatusBadge(ticket.status)}
                          <Badge variant="outline" className="text-xs">
                            {ticket.type}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          <strong>Reason:</strong> {ticket.reason}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>
                              Requested by {ticket.requester.fullName || ticket.requester.email}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        
                        {ticket.reviewer && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Reviewed by {ticket.reviewer.fullName || ticket.reviewer.email}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {ticket.status === 'pending' && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReview(ticket, 'approve')}
                          disabled={isLoading}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReview(ticket, 'reject')}
                          disabled={isLoading}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No deletion requests</h3>
              <p className="text-muted-foreground">
                All deletion requests will appear here for review
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Confirmation Dialog */}
      <AlertDialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {reviewAction === 'approve' ? 'Approve' : 'Reject'} Deletion Request
            </AlertDialogTitle>
            <AlertDialogDescription>
              {reviewAction === 'approve' ? (
                <>
                  Are you sure you want to approve the deletion of "{selectedTicket?.itemName}"? 
                  This will permanently delete the {selectedTicket?.type} and cannot be undone.
                </>
              ) : (
                <>
                  Are you sure you want to reject the deletion request for "{selectedTicket?.itemName}"? 
                  The {selectedTicket?.type} will remain active.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReviewConfirm}
              className={reviewAction === 'approve' 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-red-600 hover:bg-red-700"
              }
            >
              {reviewAction === 'approve' ? 'Approve & Delete' : 'Reject Request'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}