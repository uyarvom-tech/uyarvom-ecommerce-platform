"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ShieldCheck } from "lucide-react"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      // Sign in with Supabase
      const { error: signInError, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) throw signInError

      // Check if user is admin/staff
      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("role")
        .eq("id", data.user.id)
        .single()

      if (adminError || !adminData) {
        // Not an admin, sign out
        await supabase.auth.signOut()
        throw new Error("Access denied. This account does not have admin privileges.")
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

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="w-full max-w-sm">
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
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@uyarvom.com"
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
