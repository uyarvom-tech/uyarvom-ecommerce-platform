import Link from "next/link"
import Image from "next/image"
import { Heart, ShoppingBag, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthButton } from "@/components/auth-button"
import { ProductsMobileMenu } from "@/components/products-mobile-menu"
import { CategoriesDropdown } from "@/components/categories-dropdown"
import { AdminCustomerToggle } from "@/components/admin-customer-toggle"
import type { Category } from "@/types"

interface ProductsHeaderProps {
  categories: Category[]
}

export function ProductsHeader({ categories }: ProductsHeaderProps) {

  return (
    <>
      <header className="premium-global-nav">
        <div className="max-w-[980px] mx-auto px-6">
          <div className="flex h-12 items-center">
            {/* Mobile Menu Toggle - Left Side (with filters) */}
            <div className="flex md:hidden items-center">
              <ProductsMobileMenu user={null} categories={categories} />
            </div>

            {/* Brand Logo - Left */}
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity duration-300 mr-8">
              <Image
                src="/logos/logo.png"
                alt="Uyarvom"
                width={40}
                height={40}
                className="h-10 w-auto"
              />
            </Link>
            
            {/* Desktop Navigation - Center */}
            <nav className="hidden items-center gap-8 md:flex flex-1 justify-center">
              <Link href="/" className="premium-nav-link">
                Home
              </Link>
              <Link href="/products" className="premium-nav-link font-semibold">
                Store
              </Link>
              <CategoriesDropdown categories={categories} />
              <Link href="/products?tab=ai-match" className="premium-nav-link flex items-center gap-1" title="AI Kitchen Match">
                <span>✨</span> AI Match
              </Link>
              <Link href="/about" className="premium-nav-link">
                About
              </Link>
              <Link href="/support" className="premium-nav-link">
                Support
              </Link>
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-black/10 text-amber-800 hover:text-amber-900 transition-all duration-300" 
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
                className="h-8 w-8 hover:bg-black/10 text-amber-800 hover:text-amber-900 transition-all duration-300" 
                asChild
              >
                <Link href="/cart">
                  <ShoppingBag className="h-4 w-4" />
                  <span className="sr-only">Cart</span>
                </Link>
              </Button>
              
              <div className="w-px h-6 bg-amber-800/20 mx-1"></div>
              
              <AuthButton />
              
              <AdminCustomerToggle />
            </div>

            {/* Mobile Actions - Right Side */}
            <div className="flex md:hidden items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-black/10 text-amber-800 hover:text-amber-900 transition-all duration-300" 
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
