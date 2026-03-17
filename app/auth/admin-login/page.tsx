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
import { createClient } from "@/lib/supabase/client"

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
      const supabase = createClient()
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error("Login failed")
      }

      const { data: adminUser } = await supabase
        .from("admin_users")
        .select("role")
        .eq("user_id", authData.user.id)
        .maybeSingle()

      if (!adminUser || !["admin", "staff", "super_admin"].includes(adminUser.role)) {
        await supabase.auth.signOut()
        throw new Error("Access denied. This account does not have staff privileges.")
      }

      router.push("/admin")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#fafaf9] p-6 selection:bg-primary/10">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-[460px] relative">
        <Card className="border border-border/40 shadow-[0_8px_40px_rgba(0,0,0,0.04)] bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden">
          <CardHeader className="pt-10 pb-6 text-center space-y-2">
            <div className="mb-6 flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-4 shadow-sm">
                <ShieldCheck className="h-7 w-7 text-primary" />
              </div>
              <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground/90">
                Uyarvom
              </h1>
              <div className="h-[1px] w-6 bg-primary/20 my-2" />
              <p className="text-[10px] font-bold text-primary uppercase tracking-[0.4em]">
                Internal Operations
              </p>
            </div>
            <CardTitle className="text-2xl font-semibold text-foreground tracking-tight">
              Admin Portal
            </CardTitle>
            <CardDescription className="text-[13px] text-muted-foreground/70">
              Staff and administrator access only
            </CardDescription>
          </CardHeader>

          <CardContent className="px-10 pb-10 space-y-6">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[13px] font-semibold text-foreground/80 ml-0.5">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="staff@uyarvom.com"
                  className="h-12 border-border/60 bg-white/50 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/40 rounded-lg transition-all"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[13px] font-semibold text-foreground/80 ml-0.5">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="h-12 border-border/60 bg-white/50 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/40 rounded-lg transition-all"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/5 p-3 text-[13px] text-destructive border border-destructive/10">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-ebony hover:bg-ebony/90 text-white font-bold text-[14px] uppercase tracking-widest rounded-lg shadow-xl hover:-translate-y-0.5 transition-all duration-200 mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Authenticating...
                  </span>
                ) : "Authorize Access"}
              </Button>
            </form>

            <div className="pt-4 text-center">
              <Link
                href="/auth/login"
                className="text-[12px] font-bold text-muted-foreground/50 hover:text-primary uppercase tracking-[0.2em] transition-all"
              >
                &larr; Exit to Customer Portal
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-[10px] text-muted-foreground/20 uppercase tracking-[0.4em] font-medium">
          Secured by Uyarvom Infrastructure &bull; 2026
        </div>
      </div>
    </div>
  )
}
