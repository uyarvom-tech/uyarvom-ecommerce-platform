import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#fafaf9] p-6 selection:bg-primary/10">
      {/* Subtle Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-[420px] relative">
        <Card className="border border-border/40 shadow-[0_8px_40px_rgba(0,0,0,0.04)] bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden">
          <CardHeader className="pt-10 pb-6 text-center space-y-2">
            <div className="mb-6 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-6 shadow-sm border border-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground/90">Uyarvom</h1>
              <div className="h-[1px] w-8 bg-primary/30 my-2" />
              <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.4em]">Artisanal Collection</p>
            </div>
            <CardTitle className="text-2xl font-semibold text-foreground tracking-tight">Check Your Email</CardTitle>
            <CardDescription className="text-[13px] text-muted-foreground/70">A verification link has been dispatched</CardDescription>
          </CardHeader>

          <CardContent className="px-10 pb-10 space-y-6">
            <p className="text-center text-[13px] text-muted-foreground/70 leading-relaxed font-medium">
              We&apos;ve sent a confirmation link to your inbox. Please activate your account to begin your journey with our editorial collections.
            </p>

            <Button asChild className="w-full h-12 bg-[#9C7C38] hover:bg-[#8b6b2e] text-white font-bold text-[14px] uppercase tracking-widest rounded-lg shadow-lg hover:-translate-y-0.5 transition-all duration-200">
              <Link href="/auth/login">Return to Sign In</Link>
            </Button>

            <div className="text-center">
              <p className="text-[11px] text-muted-foreground/40 uppercase tracking-widest font-bold">
                Check your spam folder if it doesn&apos;t arrive
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
