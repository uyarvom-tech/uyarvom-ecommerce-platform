// @ts-nocheck
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
import { createOrder } from "@/lib/actions/checkout"
import { addAddress } from "@/lib/actions/address"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { GoogleMapsAddressPicker } from "@/components/google-maps-address-picker"

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
  const [mapAddress, setMapAddress] = useState<any>(null)

  const router = useRouter()
  const supabase = createClient()

  const handleAddAddress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const fullName = (formData.get("fullName") as string)?.trim()
    const phone = (formData.get("phone") as string)?.trim()
    const addressLine1 = (formData.get("addressLine1") as string)?.trim() || mapAddress?.addressLine1 || ''
    const addressLine2 = (formData.get("addressLine2") as string)?.trim() || mapAddress?.addressLine2 || ''
    const city = (formData.get("city") as string)?.trim() || mapAddress?.city || ''
    const state = (formData.get("state") as string)?.trim() || mapAddress?.state || ''
    const postalCode = (formData.get("postalCode") as string)?.trim() || mapAddress?.postalCode || ''

    if (!fullName || !phone || !addressLine1 || !city || !state || !postalCode) {
      toast.error("Please fill in all required fields")
      return
    }

    const result = await addAddress({ fullName, phone, addressLine1, addressLine2, city, state, postalCode })

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success("Address added successfully")
    setShowAddressDialog(false)
    setMapAddress(null)
    router.refresh()
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address")
      return
    }

    if (paymentMethod === "cod" && orderTotal.total > 10000) {
      toast.error("Cash on Delivery is only available for orders below ₹10,000")
      return
    }

    setIsPlacingOrder(true)

    try {
      const result = await createOrder({
        addressId: selectedAddress,
        paymentMethod,
        notes,
      })

      if (result.error) {
        toast.error(result.error)
        setIsPlacingOrder(false)
        return
      }

      if (paymentMethod === "online" && result.razorpayOrderId) {
        const options = {
          key: result.key,
          amount: result.amount,
          currency: "INR",
          name: "Uyarvom",
          description: "Purchase from Uyarvom",
          order_id: result.razorpayOrderId,
          handler: async function (response: any) {
            try {
              const verifyRes = await fetch("/api/checkout/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderId: result.orderId,
                }),
              })

              const verifyData = await verifyRes.json()

              if (verifyData.success) {
                toast.success("Payment successful! Order placed.")
                router.push(`/orders/${result.orderId}`)
              } else {
                toast.error("Payment verification failed. Please contact support.")
                router.push(`/orders/${result.orderId}`)
              }
            } catch (error) {
              console.error("Verification error:", error)
              toast.error("An error occurred during payment verification.")
              router.push(`/orders/${result.orderId}`)
            }
          },
          prefill: {
            name: result.customerName,
            email: result.customerEmail,
            contact: result.customerPhone,
          },
          theme: {
            color: "#000000",
          },
        }

        const rzp = new (window as any).Razorpay(options)
        rzp.on("payment.failed", function (response: any) {
          toast.error("Payment failed: " + response.error.description)
          router.push(`/orders/${result.orderId}`)
        })
        rzp.open()
      } else {
        toast.success("Order placed successfully!")
        router.push(`/orders/${result.orderId}`)
      }
    } catch (error) {
      console.error("Order placement error:", error)
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
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Address</DialogTitle>
                    <DialogDescription>Search or drop a pin on the map to set your delivery location</DialogDescription>
                  </DialogHeader>

                  {/* Google Maps Address Picker */}
                  <GoogleMapsAddressPicker onAddressSelect={(addr) => setMapAddress(addr)} />

                  <form onSubmit={handleAddAddress} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input id="fullName" name="fullName" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone *</Label>
                        <Input id="phone" name="phone" type="tel" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addressLine1">Address Line 1 *</Label>
                      <Input id="addressLine1" name="addressLine1" defaultValue={mapAddress?.addressLine1 || ''} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addressLine2">Address Line 2 / Landmark</Label>
                      <Input id="addressLine2" name="addressLine2" defaultValue={mapAddress?.addressLine2 || ''} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City *</Label>
                        <Input id="city" name="city" defaultValue={mapAddress?.city || ''} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State *</Label>
                        <Input id="state" name="state" defaultValue={mapAddress?.state || ''} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">Pincode *</Label>
                        <Input id="postalCode" name="postalCode" defaultValue={mapAddress?.postalCode || ''} required />
                      </div>
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
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Address</DialogTitle>
                    <DialogDescription>Search or drop a pin on the map to set your delivery location</DialogDescription>
                  </DialogHeader>

                  {/* Google Maps Address Picker */}
                  <GoogleMapsAddressPicker onAddressSelect={(addr) => setMapAddress(addr)} />

                  <form onSubmit={handleAddAddress} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input id="fullName" name="fullName" defaultValue={profile?.full_name || ""} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone *</Label>
                        <Input id="phone" name="phone" type="tel" defaultValue={profile?.phone || ""} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addressLine1">Address Line 1 *</Label>
                      <Input id="addressLine1" name="addressLine1" key={mapAddress?.addressLine1} defaultValue={mapAddress?.addressLine1 || ''} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addressLine2">Address Line 2 / Landmark</Label>
                      <Input id="addressLine2" name="addressLine2" key={mapAddress?.addressLine2} defaultValue={mapAddress?.addressLine2 || ''} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City *</Label>
                        <Input id="city" name="city" key={mapAddress?.city} defaultValue={mapAddress?.city || ''} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State *</Label>
                        <Input id="state" name="state" key={mapAddress?.state} defaultValue={mapAddress?.state || ''} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">Pincode *</Label>
                        <Input id="postalCode" name="postalCode" key={mapAddress?.postalCode} defaultValue={mapAddress?.postalCode || ''} required />
                      </div>
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
                {orderTotal.total > 10000 && (
                  <div className="text-xs text-amber-600 font-medium mt-1">
                    COD only available for orders below ₹10,000
                  </div>
                )}
              </Label>
            </div>
            <div className={`flex items-center space-x-3 rounded-lg border p-4 ${orderTotal.total > 10000 ? 'bg-muted/50' : ''}`}>
              <RadioGroupItem value="online" id="online" />
              <Label htmlFor="online" className="flex-1 cursor-pointer">
                <div className="font-semibold">Online Payment</div>
                <div className="text-sm text-muted-foreground">UPI, Cards, Net Banking</div>
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
