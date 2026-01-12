"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ShieldCheck } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Check if we're using placeholder Supabase credentials (demo mode)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const isDemo = supabaseUrl.includes('placeholder')
      
      if (isDemo) {
        // Demo mode - use existing demo authentication
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Login failed')
        }

        // Check if user has admin or staff role
        if (!['admin', 'staff'].includes(data.user.role)) {
          throw new Error("Access denied. This account does not have admin or staff privileges.")
        }

        // Store user in localStorage for demo auth
        localStorage.setItem('demo-user', JSON.stringify(data.user))
      } else {
        // Production mode - use Supabase authentication
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (authError) {
          throw new Error(authError.message)
        }

        if (!authData.user) {
          throw new Error('Login failed')
        }

        // Check if user is admin
        const { data: adminUser, error: adminError } = await supabase
          .from('admin_users')
          .select('role')
          .eq('user_id', authData.user.id)
          .single()

        if (adminError || !adminUser) {
          await supabase.auth.signOut()
          throw new Error("Access denied. This account does not have admin privileges.")
        }

        if (!['admin', 'staff', 'super_admin'].includes(adminUser.role)) {
          await supabase.auth.signOut()
          throw new Error("Access denied. Insufficient privileges.")
        }
      }

      // Redirect to admin dashboard
      router.push("/admin")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemoCredentials = (email: string, password: string) => {
    setEmail(email)
    setPassword(password)
  }

  // Check if we're in demo mode to show demo credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const isDemo = supabaseUrl.includes('placeholder')

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="w-full max-w-md">
        <Card className="border-2 border-primary/20">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-primary/10 p-3">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Admin Portal</CardTitle>
            <CardDescription>Staff & Administrator Access Only</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Demo Admin Credentials Section - Only show in demo mode */}
            {isDemo && (
              <div className="mb-6 rounded-lg border bg-orange-50 p-4">
                <h3 className="mb-3 font-semibold text-orange-900">Demo Admin Credentials</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-orange-800">Admin:</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fillDemoCredentials('admin@uyarvom.com', 'admin123')}
                      className="h-6 px-2 text-xs"
                    >
                      Use
                    </Button>
                  </div>
                  <div className="text-xs text-orange-600">admin@uyarvom.com / admin123</div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-orange-800">Super Admin:</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fillDemoCredentials('superadmin@uyarvom.com', 'super123')}
                      className="h-6 px-2 text-xs"
                    >
                      Use
                    </Button>
                  </div>
                  <div className="text-xs text-orange-600">superadmin@uyarvom.com / super123</div>

                  <div className="flex items-center justify-between">
                    <span className="text-orange-800">Staff:</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fillDemoCredentials('staff@uyarvom.com', 'staff123')}
                      className="h-6 px-2 text-xs"
                    >
                      Use
                    </Button>
                  </div>
                  <div className="text-xs text-orange-600">staff@uyarvom.com / staff123</div>

                  <div className="flex items-center justify-between">
                    <span className="text-orange-800">Manager:</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fillDemoCredentials('manager@uyarvom.com', 'manager123')}
                      className="h-6 px-2 text-xs"
                    >
                      Use
                    </Button>
                  </div>
                  <div className="text-xs text-orange-600">manager@uyarvom.com / manager123</div>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={isDemo ? "admin@uyarvom.com" : "your-email@example.com"}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Access Admin Portal"}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Not an admin?{" "}
              <Link href="/auth/login" className="font-medium text-primary underline-offset-4 hover:underline">
                Customer Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
