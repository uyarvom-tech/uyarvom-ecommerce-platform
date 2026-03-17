'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function OfferCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <Button
      type="button"
      variant="outline"
      onClick={async () => {
        await navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="rounded-full"
    >
      {copied ? "Copied" : `Copy ${code}`}
    </Button>
  )
}
