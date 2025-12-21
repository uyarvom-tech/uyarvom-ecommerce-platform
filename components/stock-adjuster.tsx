"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function StockAdjuster({
  productId,
  currentStock,
  adminUserId,
}: {
  productId: string
  currentStock: number
  adminUserId: string
}) {
  const [changeType, setChangeType] = useState<"restock" | "adjustment" | "damage">("restock")
  const [quantity, setQuantity] = useState("")
  const [reason, setReason] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleAdjust = async () => {
    const quantityChange = Number.parseInt(quantity)
    if (!quantityChange || quantityChange === 0) {
      toast.error("Please enter a valid quantity")
      return
    }

    setIsUpdating(true)

    // Calculate new stock
    const newStock = Math.max(0, currentStock + quantityChange)

    // Update product stock
    const { error: productError } = await supabase
      .from("products")
      .update({ stock_quantity: newStock })
      .eq("id", productId)

    if (productError) {
      toast.error("Failed to update stock")
      setIsUpdating(false)
      return
    }

    // Log the change
    const { error: logError } = await supabase.from("inventory_logs").insert({
      product_id: productId,
      change_type: changeType,
      quantity_change: quantityChange,
      quantity_before: currentStock,
      quantity_after: newStock,
      reason: reason || null,
      admin_user_id: adminUserId,
    })

    if (logError) {
      console.error("[v0] Failed to log inventory change:", logError)
    }

    toast.success("Stock updated successfully")
    setQuantity("")
    setReason("")
    setIsUpdating(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted p-4 text-center">
        <p className="text-sm text-muted-foreground">Current Stock</p>
        <p className="text-3xl font-bold">{currentStock}</p>
      </div>

      <div className="space-y-2">
        <Label>Change Type</Label>
        <Select value={changeType} onValueChange={(value: any) => setChangeType(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="restock">Restock</SelectItem>
            <SelectItem value="adjustment">Adjustment</SelectItem>
            <SelectItem value="damage">Damage/Loss</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Quantity Change</Label>
        <Input
          type="number"
          placeholder={changeType === "damage" ? "-10" : "+50"}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Use positive numbers to add stock, negative to reduce
          {quantity && ` (New stock: ${Math.max(0, currentStock + Number.parseInt(quantity))})`}
        </p>
      </div>

      <div className="space-y-2">
        <Label>Reason (Optional)</Label>
        <Textarea
          placeholder="Enter reason for stock change"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
        />
      </div>

      <Button onClick={handleAdjust} disabled={isUpdating || !quantity} className="w-full">
        {isUpdating ? "Updating..." : "Update Stock"}
      </Button>
    </div>
  )
}
