"use client"

import { Printer } from "lucide-react"

export function OrderInvoicePrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden h-12 w-12 border border-black flex items-center justify-center hover:bg-black hover:text-white transition-all"
      aria-label="Print invoice"
    >
      <Printer className="h-5 w-5" />
    </button>
  )
}
