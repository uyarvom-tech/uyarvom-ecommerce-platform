import Link from "next/link"
import Image from "next/image"
import { Heart, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthButton } from "@/components/auth-button"
import { ProductsSearch } from "@/components/products-search"

export async function Header() {
  return (
    <header className="premium-global-nav">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="grid grid-cols-3 h-16 items-center gap-2 md:gap-4">
          {/* Left Partition - Logo + Brand Name */}
          <div className="flex items-center justify-start">
            <Link href="/" className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity duration-300">
              <Image
                src="/logos/logo.png"
                alt="Uyarvom"
                width={40}
                height={40}
                className="h-8 w-auto md:h-16"
              />
              <Image
                src="/uyarvom-title.png"
                alt="Uyarvom"
                width={120}
                height={32}
                className="h-6 w-auto md:h-9 hidden sm:block"
              />
              <span className="text-lg md:text-xl font-bold text-amber-800 tracking-wide sm:hidden">
                Uyarvom
              </span>
            </Link>
          </div>
          
          {/* Center Partition - Search Bar */}
          <div className="flex justify-center">
            <div className="w-full max-w-lg">
              <ProductsSearch />
            </div>
          </div>

          {/* Right Partition - User Actions */}
          <div className="flex items-center justify-end gap-1 md:gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 md:h-10 md:w-10 hover:bg-black/10 text-amber-800 hover:text-amber-900 transition-all duration-300" 
              asChild
            >
              <Link href="/wishlist">
                <Heart className="h-4 w-4 md:h-5 md:w-5" />
                <span className="sr-only">Favorites</span>
              </Link>
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 md:h-10 md:w-10 hover:bg-black/10 text-amber-800 hover:text-amber-900 transition-all duration-300" 
              asChild
            >
              <Link href="/cart">
                <ShoppingBag className="h-4 w-4 md:h-5 md:w-5" />
                <span className="sr-only">Cart</span>
              </Link>
            </Button>
            
            <AuthButton />
          </div>
        </div>
      </div>
    </header>
  )
}
