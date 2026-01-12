'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ReactNode } from 'react'

interface AdminAwareLinkProps {
  href: string
  children: ReactNode
  className?: string
  title?: string
}

export function AdminAwareLink({ href, children, className, title }: AdminAwareLinkProps) {
  const searchParams = useSearchParams()
  const isFromAdmin = searchParams.get('admin') === 'true'
  
  // Add admin=true parameter if we're currently in admin view
  const finalHref = isFromAdmin 
    ? href.includes('?') 
      ? `${href}&admin=true`
      : `${href}?admin=true`
    : href
  
  return (
    <Link href={finalHref} className={className} title={title}>
      {children}
    </Link>
  )
}
