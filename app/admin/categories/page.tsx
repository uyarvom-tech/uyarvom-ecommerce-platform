import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CategoryManager } from "@/components/category-manager"
import { redirect } from "next/navigation"

export default async function AdminCategoriesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/admin/categories")
  }

  const { data: adminUser } = await supabase.from("admin_users").select("*").eq("id", user.id).single()

  if (!adminUser) {
    redirect("/")
  }

  const { data: categories } = await supabase.from("categories").select("*").order("display_order")

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AdminHeader />
      <main className="flex-1 px-6 py-8">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold tracking-tight">Categories Management</h1>
            <p className="text-muted-foreground">Organize your product catalog</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryManager categories={categories || []} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
