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

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}`,
          data: {
            full_name: fullName,
            phone: phone,
          },
        },
      })
      if (error) throw error
      router.push("/auth/sign-up-success")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#fafaf9] p-6 selection:bg-primary/10">
      {/* Subtle Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-[440px] relative">
        <Card className="border border-border/40 shadow-[0_8px_40px_rgba(0,0,0,0.04)] bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden">
          <CardHeader className="pt-10 pb-6 text-center space-y-2">
            <div className="mb-6 flex flex-col items-center">
              <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground/90">Uyarvom</h1>
              <div className="h-[1px] w-8 bg-primary/30 my-2" />
              <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.4em]">Artisanal Collection</p>
            </div>
            <CardTitle className="text-2xl font-semibold text-foreground tracking-tight">Create Account</CardTitle>
            <CardDescription className="text-[13px] text-muted-foreground/70">Join our community of craft enthusiasts</CardDescription>
          </CardHeader>

          <CardContent className="px-10 pb-10 space-y-6">
            <form onSubmit={handleSignUp} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-[13px] font-semibold text-foreground/80 ml-0.5">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  className="h-12 border-border/60 bg-white/50 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/40 rounded-lg transition-all"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[13px] font-semibold text-foreground/80 ml-0.5">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="h-12 border-border/60 bg-white/50 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/40 rounded-lg transition-all"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-[13px] font-semibold text-foreground/80 ml-0.5">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  className="h-12 border-border/60 bg-white/50 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/40 rounded-lg transition-all"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[13px] font-semibold text-foreground/80 ml-0.5">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  className="h-12 border-border/60 bg-white/50 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/40 rounded-lg transition-all"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && <div className="rounded-lg bg-destructive/5 p-3 text-[13px] text-destructive border border-destructive/10">{error}</div>}

              <Button
                type="submit"
                className="w-full h-12 bg-[#9C7C38] hover:bg-[#8b6b2e] text-white font-bold text-[14px] uppercase tracking-widest rounded-lg shadow-[0_4px_14px_rgba(156,124,56,0.3)] hover:shadow-[0_6px_20px_rgba(156,124,56,0.4)] hover:-translate-y-0.5 transition-all duration-200 mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </span>
                ) : "Create Account"}
              </Button>
            </form>

            <div className="pt-4 text-center">
              <p className="text-[13px] text-muted-foreground/60">
                Already have an account?{" "}
                <Link href="/auth/login" className="font-bold text-primary hover:text-primary/80 transition-colors">
                  Sign in
                </Link>
              </p>
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
