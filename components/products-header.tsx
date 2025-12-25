import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import Image from "next/image"
import { Search, Heart, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthButton } from "@/components/auth-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { ProductsMobileMenu } from "@/components/products-mobile-menu"

interface ProductsHeaderProps {
  categories: any[]
}

export async function ProductsHeader({ categories }: ProductsHeaderProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <>
      <header className="premium-global-nav">
        <div className="max-w-[980px] mx-auto px-6">
          <div className="flex h-12 items-center justify-between">
            {/* Mobile Menu Toggle - Left Side (with filters) */}
            <div className="flex md:hidden items-center">
              <ProductsMobileMenu user={user} categories={categories} />
            </div>

            {/* Brand Logo - Center on Mobile, Left on Desktop */}
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity duration-300 md:mr-auto">
              <Image
                src="/logos/logo.png"
                alt="Uyarvom"
                width={32}
                height={32}
                className="h-8 w-auto"
              />
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-8 md:flex">
              <Link href="/" className="premium-nav-link">
                Home
              </Link>
              <Link href="/products" className="premium-nav-link text-white font-semibold">
                Store
              </Link>
              <Link href="/categories" className="premium-nav-link">
                Categories
              </Link>
              <Link href="/about" className="premium-nav-link">
                About
              </Link>
              <Link href="/support" className="premium-nav-link">
                Support
              </Link>
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-white/20 text-white/90 hover:text-white transition-all duration-300" 
                asChild
              >
                <Link href="/search">
                  <Search className="h-4 w-4" />
                  <span className="sr-only">Search</span>
                </Link>
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-white/20 text-white/90 hover:text-white transition-all duration-300" 
                asChild
              >
                <Link href="/wishlist">
                  <Heart className="h-4 w-4" />
                  <span className="sr-only">Wishlist</span>
                </Link>
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-white/20 text-white/90 hover:text-white transition-all duration-300" 
                asChild
              >
                <Link href="/cart">
                  <ShoppingBag className="h-4 w-4" />
                  <span className="sr-only">Cart</span>
                </Link>
              </Button>
              
              <ThemeToggle />
              <AuthButton />
            </div>

            {/* Mobile Actions - Right Side */}
            <div className="flex md:hidden items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-white/20 text-white/90 hover:text-white transition-all duration-300" 
                asChild
              >
                <Link href="/search">
                  <Search className="h-4 w-4" />
                  <span className="sr-only">Search</span>
                </Link>
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-white/20 text-white/90 hover:text-white transition-all duration-300" 
                asChild
              >
                <Link href="/cart">
                  <ShoppingBag className="h-4 w-4" />
                  <span className="sr-only">Cart</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}