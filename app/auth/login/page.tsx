"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/"

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push(redirect)
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

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="w-full max-w-md">
        <Card className="border-2">
          <CardHeader className="text-center">
            <div className="mb-2 text-center">
              <h1 className="font-serif text-3xl font-bold tracking-tight">Uyarvom</h1>
              <p className="text-xs text-muted-foreground">Handcrafted Ceramic Excellence</p>
            </div>
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>Sign in to continue shopping</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Demo Credentials Section */}
            <div className="mb-6 rounded-lg border bg-blue-50 p-4">
              <h3 className="mb-3 font-semibold text-blue-900">Demo Login Credentials</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-blue-800">Customer:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fillDemoCredentials('customer@example.com', 'customer123')}
                    className="h-6 px-2 text-xs"
                  >
                    Use
                  </Button>
                </div>
                <div className="text-xs text-blue-600">customer@example.com / customer123</div>
                
                <div className="flex items-center justify-between">
                  <span className="text-blue-800">Demo User:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fillDemoCredentials('demo@example.com', 'demo123')}
                    className="h-6 px-2 text-xs"
                  >
                    Use
                  </Button>
                </div>
                <div className="text-xs text-blue-600">demo@example.com / demo123</div>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
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
              {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/auth/sign-up" className="font-medium text-primary underline-offset-4 hover:underline">
                Sign up
              </Link>
            </div>
            <div className="mt-4 border-t pt-4 text-center text-sm text-muted-foreground">
              Are you staff or admin?{" "}
              <Link href="/auth/admin-login" className="font-medium text-primary underline-offset-4 hover:underline">
                Admin Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
