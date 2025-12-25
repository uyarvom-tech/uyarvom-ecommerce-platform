import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="bg-secondary/30 border-t border-border/50">
      <div className="apple-container-wide apple-section">
        {/* Apple-style Footer Content */}
        <div className="grid gap-12 md:grid-cols-4">
          <div>
            <div className="mb-4">
              <Image
                src="/logos/logo_with_title.png"
                alt="Uyarvom"
                width={400}
                height={220}
                className="h-48 w-auto"
              />
            </div>
            <p className="apple-body leading-relaxed mb-4">
              {/* Premium ceramic houseware for modern kitchens. Quality craftsmanship, timeless design. */}
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-6 text-[17px]">Shop</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/products" className="apple-link transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 inline-block no-underline">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/categories" className="apple-link transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 inline-block no-underline">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/products?featured=true" className="apple-link transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 inline-block no-underline">
                  Featured
                </Link>
              </li>
              <li>
                <Link href="/search" className="apple-link transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 inline-block no-underline">
                  Search
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-6 text-[17px]">Support</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/contact" className="apple-link transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 inline-block no-underline">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="apple-link transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 inline-block no-underline">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/returns" className="apple-link transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 inline-block no-underline">
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link href="/warranty" className="apple-link transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 inline-block no-underline">
                  Warranty
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-6 text-[17px]">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="apple-link transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 inline-block no-underline">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/careers" className="apple-link transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 inline-block no-underline">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="apple-link transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 inline-block no-underline">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="apple-link transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 inline-block no-underline">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Apple-style Footer Bottom */}
        <div className="mt-16 pt-8 border-t border-border/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="apple-body text-sm">
              &copy; {new Date().getFullYear()} Uyarvom. All rights reserved.
            </p>
            
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="apple-link text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 inline-block no-underline">
                Privacy Policy
              </Link>
              <Link href="/terms" className="apple-link text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 inline-block no-underline">
                Terms of Use
              </Link>
              <Link href="/cookies" className="apple-link text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 inline-block no-underline">
                Cookies
              </Link>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="apple-body text-xs">
              Made with care in India 🇮🇳 | Free shipping on orders over ₹999
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
