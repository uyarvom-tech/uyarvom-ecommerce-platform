"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Plus, MapPin } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function CheckoutForm({
  userId,
  addresses,
  profile,
  cartItems,
  orderTotal,
}: {
  userId: string
  addresses: any[]
  profile: any
  cartItems: any[]
  orderTotal: { subtotal: number; shippingCost: number; tax: number; total: number }
}) {
  const [selectedAddress, setSelectedAddress] = useState(addresses.find((a) => a.is_default)?.id || "")
  const [paymentMethod, setPaymentMethod] = useState("cod")
  const [notes, setNotes] = useState("")
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [showAddressDialog, setShowAddressDialog] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const handleAddAddress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const { error } = await supabase.from("addresses").insert({
      user_id: userId,
      full_name: formData.get("fullName"),
      phone: formData.get("phone"),
      address_line1: formData.get("addressLine1"),
      address_line2: formData.get("addressLine2"),
      city: formData.get("city"),
      state: formData.get("state"),
      postal_code: formData.get("postalCode"),
      is_default: addresses.length === 0,
    })

    if (error) {
      toast.error("Failed to add address")
      return
    }

    toast.success("Address added successfully")
    setShowAddressDialog(false)
    router.refresh()
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address")
      return
    }

    setIsPlacingOrder(true)

    try {
      // Generate order number
      const { data: orderNumberData } = await supabase.rpc("generate_order_number")

      const orderNumber = orderNumberData || `ORD-${Date.now()}`

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          user_id: userId,
          status: "pending",
          payment_status: "pending",
          payment_method: paymentMethod,
          subtotal: orderTotal.subtotal,
          shipping_cost: orderTotal.shippingCost,
          tax: orderTotal.tax,
          total: orderTotal.total,
          shipping_address_id: selectedAddress,
          billing_address_id: selectedAddress,
          notes,
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        total: item.product.price * item.quantity,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) throw itemsError

      // Clear cart
      const { error: cartError } = await supabase.from("cart_items").delete().eq("user_id", userId)

      if (cartError) throw cartError

      toast.success("Order placed successfully!")
      router.push(`/orders/${order.id}`)
    } catch (error) {
      console.error("[v0] Order placement error:", error)
      toast.error("Failed to place order. Please try again.")
      setIsPlacingOrder(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Delivery Address */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Address</CardTitle>
        </CardHeader>
        <CardContent>
          {addresses.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">No saved addresses</p>
              <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Address
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add New Address</DialogTitle>
                    <DialogDescription>Enter your delivery address details</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddAddress} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input id="fullName" name="fullName" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" name="phone" type="tel" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addressLine1">Address Line 1</Label>
                      <Input id="addressLine1" name="addressLine1" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                      <Input id="addressLine2" name="addressLine2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" name="city" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input id="state" name="state" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input id="postalCode" name="postalCode" required />
                    </div>
                    <Button type="submit" className="w-full">
                      Save Address
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="space-y-4">
              <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
                {addresses.map((address) => (
                  <div key={address.id} className="flex items-start space-x-3 rounded-lg border p-4">
                    <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                    <Label htmlFor={address.id} className="flex-1 cursor-pointer">
                      <div className="font-semibold">{address.full_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {address.address_line1}
                        {address.address_line2 && `, ${address.address_line2}`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {address.city}, {address.state} {address.postal_code}
                      </div>
                      <div className="text-sm text-muted-foreground">Phone: {address.phone}</div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full bg-transparent">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Address
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add New Address</DialogTitle>
                    <DialogDescription>Enter your delivery address details</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddAddress} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input id="fullName" name="fullName" defaultValue={profile?.full_name || ""} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" name="phone" type="tel" defaultValue={profile?.phone || ""} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addressLine1">Address Line 1</Label>
                      <Input id="addressLine1" name="addressLine1" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                      <Input id="addressLine2" name="addressLine2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" name="city" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input id="state" name="state" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input id="postalCode" name="postalCode" required />
                    </div>
                    <Button type="submit" className="w-full">
                      Save Address
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="flex items-center space-x-3 rounded-lg border p-4">
              <RadioGroupItem value="cod" id="cod" />
              <Label htmlFor="cod" className="flex-1 cursor-pointer">
                <div className="font-semibold">Cash on Delivery (COD)</div>
                <div className="text-sm text-muted-foreground">Pay when you receive your order</div>
              </Label>
            </div>
            <div className="flex items-center space-x-3 rounded-lg border p-4 opacity-50">
              <RadioGroupItem value="online" id="online" disabled />
              <Label htmlFor="online" className="flex-1 cursor-not-allowed">
                <div className="font-semibold">Online Payment</div>
                <div className="text-sm text-muted-foreground">UPI, Cards, Net Banking (Coming Soon)</div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Order Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Order Notes (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Any special instructions for delivery?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Place Order Button */}
      <Button onClick={handlePlaceOrder} disabled={isPlacingOrder || !selectedAddress} className="w-full" size="lg">
        {isPlacingOrder ? "Placing Order..." : "Place Order"}
      </Button>
    </div>
  )
}
