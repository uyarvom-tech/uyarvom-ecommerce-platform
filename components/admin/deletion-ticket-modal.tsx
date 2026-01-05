'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface DeletionTicketModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'product' | 'category'
  itemId: string
  itemName: string
  onTicketCreated?: () => void
}

export function DeletionTicketModal({ 
  isOpen, 
  onClose, 
  type, 
  itemId, 
  itemName,
  onTicketCreated 
}: DeletionTicketModalProps) {
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for deletion')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/deletion-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          itemId,
          itemName,
          reason: reason.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create deletion request')
      }

      toast.success('Deletion request submitted successfully! An admin will review it.')
      setReason('')
      onClose()
      onTicketCreated?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit deletion request')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Request {type === 'product' ? 'Product' : 'Category'} Deletion
          </AlertDialogTitle>
          <AlertDialogDescription>
            You're requesting to delete "{itemName}". Please provide a reason for this deletion request.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="reason" className="text-sm font-medium">
              Reason for Deletion *
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this item should be deleted..."
              rows={4}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This will be reviewed by an admin who can approve or reject the request.
            </p>
          </div>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleSubmit}
            disabled={isSubmitting || !reason.trim()}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}