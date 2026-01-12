'use client'

import { AdminAwareLink } from "@/components/admin-aware-link"
import Image from "next/image"

export function AdminAwareLogo() {
  return (
    <AdminAwareLink href="/" className="flex items-center hover:opacity-80 transition-opacity duration-300 mr-8">
      <Image
        src="/logos/logo.png"
        alt="Uyarvom"
        width={40}
        height={40}
        className="h-10 w-auto"
      />
    </AdminAwareLink>
  )
}
