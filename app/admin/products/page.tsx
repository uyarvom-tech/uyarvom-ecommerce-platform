import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import Image from "next/image"

export default async function AdminProductsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/admin/products")
  }

  const { data: adminUser } = await supabase.from("admin_users").select("*").eq("id", user.id).single()

  if (!adminUser) {
    redirect("/")
  }

  const { data: products } = await supabase
    .from("products")
    .select(
      `
      *,
      category:categories(name),
      images:product_images(image_url, alt_text, is_primary)
    `,
    )
    .order("created_at", { ascending: false })

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AdminHeader />
      <main className="flex-1 px-6 py-8">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold tracking-tight">Products Management</h1>
              <p className="text-muted-foreground">Manage your product catalog</p>
            </div>
            <Button asChild>
              <Link href="/admin/products/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products?.map((product) => {
              const primaryImage = product.images?.find((img: any) => img.is_primary) || product.images?.[0]
              const isLowStock = product.stock_quantity <= product.low_stock_threshold
              const isOutOfStock = product.stock_quantity <= 0

              return (
                <Link key={product.id} href={`/admin/products/${product.id}`}>
                  <Card className="overflow-hidden transition-all hover:shadow-lg">
                    <div className="relative aspect-square bg-muted">
                      <Image
                        src={
                          primaryImage?.image_url ||
                          `/placeholder.svg?height=400&width=400&query=${product.name || "/placeholder.svg"}`
                        }
                        alt={product.name}
                        width={400}
                        height={400}
                        className="h-full w-full object-cover"
                      />
                      {!product.is_active && (
                        <Badge className="absolute left-3 top-3" variant="destructive">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <p className="mb-1 text-xs text-muted-foreground">{product.category?.name}</p>
                      <h3 className="mb-2 font-semibold">{product.name}</h3>
                      <div className="flex items-center justify-between">
                        <p className="font-bold">₹{Number(product.price).toLocaleString("en-IN")}</p>
                        {isOutOfStock ? (
                          <Badge variant="destructive">Out of Stock</Badge>
                        ) : isLowStock ? (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge variant="secondary">{product.stock_quantity} in stock</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
