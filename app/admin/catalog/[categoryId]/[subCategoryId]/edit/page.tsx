import { prisma } from "@/lib/prisma"
import { AdminHeader } from "@/components/admin-header"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CategoryEditForm } from "@/components/admin/category-edit-form"

export const dynamic = 'force-dynamic'

export default async function EditSubCategoryPage({ params }: { params: Promise<{ categoryId: string; subCategoryId: string }> }) {
  const { categoryId, subCategoryId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login?redirect=/admin/catalog")

  const admin = await prisma.adminUser.findUnique({ where: { userId: user.id } })
  if (!admin) redirect("/")

  const category = await prisma.category.findUnique({ where: { id: subCategoryId, parentId: categoryId } })
  if (!category) notFound()

  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <AdminHeader userRole={admin.role} />
      <main className="flex-1 px-8 py-10">
        <div className="container mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight mb-8">Edit Sub-Category</h1>
          <CategoryEditForm category={category} type="sub" parentId={categoryId} />
        </div>
      </main>
    </div>
  )
}
