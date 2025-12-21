"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const statuses = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
]

export function OrderStatusUpdater({
  orderId,
  currentStatus,
  currentTrackingNumber,
}: {
  orderId: string
  currentStatus: string
  currentTrackingNumber: string | null
}) {
  const [status, setStatus] = useState(currentStatus)
  const [trackingNumber, setTrackingNumber] = useState(currentTrackingNumber || "")
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleUpdate = async () => {
    setIsUpdating(true)

    const updateData: any = { status }

    if (trackingNumber) {
      updateData.tracking_number = trackingNumber
    }

    if (status === "shipped" && !currentStatus.includes("shipped")) {
      updateData.shipped_at = new Date().toISOString()
    }

    if (status === "delivered" && !currentStatus.includes("delivered")) {
      updateData.delivered_at = new Date().toISOString()
      updateData.payment_status = "paid"
    }

    if (status === "cancelled" && !currentStatus.includes("cancelled")) {
      updateData.cancelled_at = new Date().toISOString()
    }

    const { error } = await supabase.from("orders").update(updateData).eq("id", orderId)

    if (error) {
      toast.error("Failed to update order")
      setIsUpdating(false)
      return
    }

    toast.success("Order updated successfully")
    setIsUpdating(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Order Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(status === "shipped" || status === "delivered") && (
        <div className="space-y-2">
          <Label>Tracking Number</Label>
          <Input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Enter tracking number"
          />
        </div>
      )}

      <Button onClick={handleUpdate} disabled={isUpdating || status === currentStatus}>
        {isUpdating ? "Updating..." : "Update Order"}
      </Button>
    </div>
  )
}
