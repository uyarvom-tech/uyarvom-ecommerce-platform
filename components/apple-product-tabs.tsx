'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Tab {
  id: string
  label: string
  href: string
}

interface AppleProductTabsProps {
  tabs: Tab[]
  className?: string
}

export function AppleProductTabs({ tabs, className = '' }: AppleProductTabsProps) {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState(
    tabs.find(tab => pathname.includes(tab.href))?.id || tabs[0]?.id
  )

  return (
    <div className={`apple-product-tabs ${className}`}>
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          onClick={() => setActiveTab(tab.id)}
          className={`apple-tab ${
            activeTab === tab.id || pathname.includes(tab.href) ? 'active' : ''
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}

// Default product tabs for the store
export const defaultProductTabs: Tab[] = [
  { id: 'all', label: 'All products', href: '/products' },
  { id: 'cookware', label: 'Cookware', href: '/products?category=cookware' },
  { id: 'bakeware', label: 'Bakeware', href: '/products?category=bakeware' },
  { id: 'dinnerware', label: 'Dinnerware', href: '/products?category=dinnerware' },
  { id: 'serveware', label: 'Serveware', href: '/products?category=serveware' },
]
