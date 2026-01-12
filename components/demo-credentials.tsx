"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy, User, Shield, Users } from "lucide-react"
import { useState } from "react"

interface CredentialSet {
  role: string
  icon: React.ReactNode
  color: string
  accounts: {
    email: string
    password: string
    name: string
  }[]
}

const credentials: CredentialSet[] = [
  {
    role: "Admin",
    icon: <Shield className="h-4 w-4" />,
    color: "bg-red-100 text-red-800 border-red-200",
    accounts: [
      { email: "admin@uyarvom.com", password: "admin123", name: "Admin User" },
      { email: "superadmin@uyarvom.com", password: "super123", name: "Super Admin" }
    ]
  },
  {
    role: "Staff",
    icon: <Users className="h-4 w-4" />,
    color: "bg-orange-100 text-orange-800 border-orange-200",
    accounts: [
      { email: "staff@uyarvom.com", password: "staff123", name: "Staff Member" },
      { email: "manager@uyarvom.com", password: "manager123", name: "Store Manager" }
    ]
  },
  {
    role: "Customer",
    icon: <User className="h-4 w-4" />,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    accounts: [
      { email: "customer@example.com", password: "customer123", name: "John Customer" },
      { email: "jane@example.com", password: "jane123", name: "Jane Smith" },
      { email: "demo@example.com", password: "demo123", name: "Demo User" }
    ]
  }
]

export function DemoCredentials() {
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(text)
      setTimeout(() => setCopiedText(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Demo Login Credentials
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Use these credentials to test different user roles and permissions
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-3">
          {credentials.map((credSet) => (
            <div key={credSet.role} className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className={credSet.color}>
                  {credSet.icon}
                  {credSet.role}
                </Badge>
              </div>
              
              <div className="space-y-2">
                {credSet.accounts.map((account, index) => (
                  <div key={index} className="rounded-lg border p-3 space-y-2">
                    <div className="font-medium text-sm">{account.name}</div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Email:</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => copyToClipboard(account.email)}
                        >
                          {copiedText === account.email ? "Copied!" : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                      <div className="text-xs font-mono bg-muted px-2 py-1 rounded">
                        {account.email}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Password:</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => copyToClipboard(account.password)}
                        >
                          {copiedText === account.password ? "Copied!" : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                      <div className="text-xs font-mono bg-muted px-2 py-1 rounded">
                        {account.password}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">Role Permissions:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li><strong>Admin:</strong> Full access to admin panel, product management, order management</li>
            <li><strong>Staff:</strong> Limited admin access, can manage products and orders</li>
            <li><strong>Customer:</strong> Shopping, cart, wishlist, account management, order history</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
