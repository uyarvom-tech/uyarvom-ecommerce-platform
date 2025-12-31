import { prisma } from "@/lib/prisma"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AccountForm } from "@/components/account-form"
import { redirect } from "next/navigation"

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
      redirect("/auth/signin?redirect=/account")
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
    redirect("/auth/signin?redirect=/account")
  }
}
