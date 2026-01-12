import { prisma } from "@/lib/prisma-safe"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AccountForm } from "@/components/account-form"
import { redirect } from "next/navigation"

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AccountPage() {
  // For demo purposes, we'll use a hardcoded user ID
  // In a real app, this would come from authentication context
  const userId = "cmjmwg4hw0002hluaf0cbp2rs" // John Doe user ID

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      // In demo mode, show a placeholder account page
      const demoUser = {
        id: userId,
        email: 'demo@uyarvom.com',
        fullName: 'Demo User',
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      return (
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1 px-6 py-8">
            <div className="container mx-auto max-w-4xl">
              <h1 className="mb-8 text-3xl font-bold tracking-tight">Account Settings</h1>

              <div className="space-y-8">
                {/* Profile Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AccountForm user={demoUser} />
                  </CardContent>
                </Card>

                <Separator />

                {/* Account Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Account Created</p>
                        <p className="text-sm">{new Date(demoUser.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                        <p className="text-sm">{new Date(demoUser.updatedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      )
    }

    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 px-6 py-8">
          <div className="container mx-auto max-w-4xl">
            <h1 className="mb-8 text-3xl font-bold tracking-tight">Account Settings</h1>

            <div className="space-y-8">
              {/* Profile Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <AccountForm user={user} />
                </CardContent>
              </Card>

              <Separator />

              {/* Account Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Account Created</p>
                      <p className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                      <p className="text-sm">{new Date(user.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  } catch (error) {
    console.error('Error loading account page:', error)
    
    // Show demo account page instead of redirecting
    const demoUser = {
      id: userId,
      email: 'demo@uyarvom.com',
      fullName: 'Demo User',
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 px-6 py-8">
          <div className="container mx-auto max-w-4xl">
            <h1 className="mb-8 text-3xl font-bold tracking-tight">Account Settings</h1>
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">Demo Mode: Database connection not available. Showing demo account.</p>
            </div>

            <div className="space-y-8">
              {/* Profile Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <AccountForm user={demoUser} />
                </CardContent>
              </Card>

              <Separator />

              {/* Account Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Account Created</p>
                      <p className="text-sm">{new Date(demoUser.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                      <p className="text-sm">{new Date(demoUser.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }
}
