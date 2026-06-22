"use client"

import { useState } from "react"
import { updateOrderStatus } from "@/lib/actions/admin"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  currentCourierName,
}: {
  orderId: string
  currentStatus: string
  currentTrackingNumber?: string | null
  currentCourierName?: string | null
}) {
  const [status, setStatus] = useState(currentStatus)
  const [trackingNumber, setTrackingNumber] = useState(currentTrackingNumber || "")
  const [courierName, setCourierName] = useState(currentCourierName || "")
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()

  const handleUpdate = async () => {
    setIsUpdating(true)
    const res = await updateOrderStatus(orderId, {
      status,
      trackingNumber: (status === "shipped" || status === "delivered") ? trackingNumber : undefined,
      courierName: (status === "shipped" || status === "delivered") ? courierName : undefined,
    })
    setIsUpdating(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("Order status updated")
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">
          Update Fulfillment Status
        </label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="rounded-none border-muted h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            {statuses.map((s) => (
              <SelectItem key={s.value} value={s.value} className="text-xs">
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(status === "shipped" || status === "delivered") && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">
              Tracking Number
            </label>
            <Input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. DELIV12345"
              className="rounded-none border-muted h-10 text-xs"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">
              Courier Name
            </label>
            <Input
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
              placeholder="e.g. Delhivery, Bluedart"
              className="rounded-none border-muted h-10 text-xs"
            />
          </div>
        </div>
      )}

      <Button
        onClick={handleUpdate}
        disabled={isUpdating || (status === currentStatus && trackingNumber === (currentTrackingNumber || "") && courierName === (currentCourierName || ""))}
        className="w-full bg-black text-white hover:bg-black/90 rounded-none h-11 text-[10px] font-bold uppercase tracking-widest"
      >
        {isUpdating ? "Processing..." : "Commit Update"}
      </Button>
    </div>
  )
}
