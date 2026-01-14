import { redirect } from 'next/navigation'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function CategoriesPage() {
  redirect('/admin/catalog')
}
