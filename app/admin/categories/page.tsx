import { AdminHeader } from "@/components/admin-header"
import { CategoryManagementFull } from "@/components/admin/category-management-full"

export default function AdminCategoriesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AdminHeader />
      <main className="flex-1 px-6 py-8">
        <div className="container mx-auto max-w-7xl">
          <CategoryManagementFull />
        </div>
      </main>
    </div>
  )
}
