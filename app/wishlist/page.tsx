import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { WishlistGrid } from "@/components/wishlist-grid"
import { getWishlistItemsForUser } from "@/lib/wishlist"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { redirect } from "next/navigation"

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function WishlistPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/wishlist")
  }

  const wishlistItems = await getWishlistItemsForUser(user.id)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30 px-6 py-12">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="font-serif mb-3 text-4xl font-bold tracking-tight">My Wishlist</h1>
            <p className="text-muted-foreground">
              {wishlistItems && wishlistItems.length > 0
                ? `You have ${wishlistItems.length} item${wishlistItems.length !== 1 ? "s" : ""} saved`
                : "Save your favorite products here"}
            </p>
          </div>

          {!wishlistItems || wishlistItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-background py-24">
              <Heart className="mb-6 h-24 w-24 text-muted-foreground/50" />
              <h2 className="font-serif mb-3 text-2xl font-semibold">Your wishlist is empty</h2>
              <p className="mb-8 text-muted-foreground">Start saving products you love</p>
              <Button asChild size="lg">
                <Link href="/products">Browse Products</Link>
              </Button>
            </div>
          ) : (
            <WishlistGrid items={wishlistItems} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
