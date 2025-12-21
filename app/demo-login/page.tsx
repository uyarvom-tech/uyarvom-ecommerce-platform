import { DemoCredentials } from "@/components/demo-credentials"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function DemoLoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 px-6 py-12">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-4">Demo Login Credentials</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Test the Uyarvom e-commerce platform with different user roles
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild>
                <Link href="/auth/login">
                  Customer Login
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/auth/admin-login">
                  Admin/Staff Login
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          
          <DemoCredentials />
          
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-800">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              Demo mode is active - No real database required
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}