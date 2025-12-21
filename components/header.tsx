import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Search, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthButton } from "@/components/auth-button"
import { CartButton } from "@/components/cart-button"

export async function Header() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let cartCount = 0
  if (user) {
    const { count } = await supabase
      .from("cart_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
    cartCount = count || 0
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Uyarvom
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/products" className="text-sm font-medium transition-colors hover:text-primary">
              Products
            </Link>
            <Link href="/categories" className="text-sm font-medium transition-colors hover:text-primary">
              Categories
            </Link>
            <Link href="/about" className="text-sm font-medium transition-colors hover:text-primary">
              About
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hidden md:inline-flex" asChild>
            <Link href="/search">
              <Search className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/wishlist">
              <Heart className="h-5 w-5" />
            </Link>
          </Button>
          <CartButton initialCount={cartCount} />
          <AuthButton />
        </div>
      </div>
    </header>
  )
}
