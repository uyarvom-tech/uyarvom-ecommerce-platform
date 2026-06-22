'use client'

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function getDeliveryEstimate(pincode: string) {
  if (!/^\d{6}$/.test(pincode)) {
    return null
  }

  const prefix = Number(pincode.slice(0, 2))

  if (prefix >= 11 && prefix <= 19) {
    return {
      title: "Fast metro delivery",
      detail: "Estimated delivery in 2-4 business days.",
      support: "Express shipping is usually available for this area.",
    }
  }

  if (prefix >= 20 && prefix <= 39) {
    return {
      title: "Standard delivery available",
      detail: "Estimated delivery in 3-5 business days.",
      support: "Most products can be delivered to this location.",
    }
  }

  return {
    title: "Extended delivery window",
    detail: "Estimated delivery in 5-7 business days.",
    support: "Large or fragile orders may take a little longer.",
  }
}

export function DeliveryChecker() {
  const [pincode, setPincode] = useState("")
  const [submittedCode, setSubmittedCode] = useState("")

  const result = useMemo(() => getDeliveryEstimate(submittedCode), [submittedCode])

  return (
    <div className="space-y-5">
      <form
        className="flex flex-col sm:flex-row gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          setSubmittedCode(pincode.trim())
        }}
      >
        <Input
          value={pincode}
          onChange={(event) => setPincode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="Enter 6-digit pincode"
          className="h-12"
          inputMode="numeric"
        />
        <Button type="submit" className="apple-button h-12 px-8">
          Check Delivery
        </Button>
      </form>

      {submittedCode && !result && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          Please enter a valid 6-digit Indian pincode.
        </div>
      )}

      {result && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary">{result.title}</p>
          <p className="text-lg font-medium text-foreground">{result.detail}</p>
          <p className="text-sm text-muted-foreground">{result.support}</p>
        </div>
      )}
    </div>
  )
}
