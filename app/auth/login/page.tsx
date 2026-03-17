"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

  const handleGoogleLogin = async () => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${redirect}`,
        },
      })
      if (error) throw error
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred with Google Login")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#fafaf9] p-6 selection:bg-primary/10">
      {/* Subtle Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-[420px] relative">
        <Card className="border border-border/40 shadow-[0_8px_40px_rgba(0,0,0,0.04)] bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden">
          <CardHeader className="pt-10 pb-4 text-center space-y-2">
            <div className="mb-6 flex flex-col items-center">
              <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground/90">Uyarvom</h1>
              <div className="h-[1px] w-8 bg-primary/30 my-2" />
              <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.4em]">Artisanal Collection</p>
            </div>
            <CardTitle className="text-2xl font-semibold text-foreground tracking-tight">Welcome Back</CardTitle>
            <CardDescription className="text-[13px] text-muted-foreground/70">Enter your credentials to access your account</CardDescription>
          </CardHeader>

          <CardContent className="px-10 pb-10 space-y-6">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="group w-full h-12 flex items-center justify-start px-4 bg-white border border-[#dadce0] rounded-lg text-[#3c4043] font-medium text-[14px] hover:bg-[#f7f7f7] hover:shadow-sm active:bg-[#eeeeee] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center w-5 h-5 mr-auto ml-1">
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              </div>
              <span className="flex-1 text-center mr-6">Continue with Google</span>
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/40" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-widest font-bold">
                <span className="bg-white px-4 text-muted-foreground/40">Or</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[13px] font-semibold text-foreground/80 ml-0.5">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="h-12 border-border/60 bg-white/50 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/40 rounded-lg transition-all"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-0.5">
                  <Label htmlFor="password" className="text-[13px] font-semibold text-foreground/80">Password</Label>
                  <Link href="/auth/forgot-password" className="text-[12px] font-medium text-primary/80 hover:text-primary hover:underline underline-offset-4">
                    Forgot?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="h-12 border-border/60 bg-white/50 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/40 rounded-lg transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && <div className="rounded-lg bg-destructive/5 p-3 text-[13px] text-destructive border border-destructive/10 animate-shake">{error}</div>}

              <Button
                type="submit"
                className="w-full h-12 bg-[#9C7C38] hover:bg-[#8b6b2e] text-white font-bold text-[14px] uppercase tracking-widest rounded-lg shadow-[0_4px_14px_rgba(156,124,56,0.3)] hover:shadow-[0_6px_20px_rgba(156,124,56,0.4)] hover:-translate-y-0.5 transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : "Sign In"}
              </Button>
            </form>

            <div className="pt-2 flex flex-col items-center gap-4">
              <p className="text-[13px] text-muted-foreground/60">
                Don&apos;t have an account?{" "}
                <Link href="/auth/sign-up" className="font-bold text-primary hover:text-primary/80 transition-colors">
                  Sign up
                </Link>
              </p>

              <div className="w-full h-[1px] bg-border/40" />

              <Link
                href="/auth/admin-login"
                className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 hover:text-primary transition-all underline-offset-8"
              >
                Access Control
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quality Guarantee Footer */}
        <div className="mt-8 text-center text-[11px] text-muted-foreground/30 uppercase tracking-[0.3em] font-medium italic">
          Curated Heritage &bull; Timeless Craft
        </div>
      </div>
    </div>
  )
}
