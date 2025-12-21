import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AccountForm } from "@/components/account-form"
import { AddressesList } from "@/components/addresses-list"
import { redirect } from "next/navigation"

export default async function AccountPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/account")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const { data: addresses } = await supabase.from("addresses").select("*").eq("user_id", user.id)

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
                <AccountForm profile={profile} userEmail={user.email || ""} />
              </CardContent>
            </Card>

            <Separator />

            {/* Addresses */}
            <Card>
              <CardHeader>
                <CardTitle>Saved Addresses</CardTitle>
              </CardHeader>
              <CardContent>
                <AddressesList addresses={addresses || []} userId={user.id} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
