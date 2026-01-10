import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="bg-secondary/30 border-t border-border/50">
      <div className="apple-container-wide py-8">
        {/* Apple-style Footer Content */}
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="mb-3">
              <Image
                src="/logos/logo_with_title.png"
                alt="Uyarvom"
                width={300}
                height={165}
                className="h-36 w-auto"
              />
            </div>
            <p className="apple-body leading-relaxed mb-3">
              {/* Premium ceramic houseware for modern kitchens. Quality craftsmanship, timeless design. */}
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-[17px]">Shop</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="apple-link transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 inline-block no-underline">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/?tab=ai-match" className="apple-link transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 inline-block no-underline">
                  ✨ AI Kitchen Match
                </Link>
              </li>
              <li>
                <Link href="/?featured=true" className="apple-link transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 inline-block no-underline">
                  Featured Products
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-[17px]">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/support" className="apple-link transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 inline-block no-underline">
                  Help Center
                </Link>
              </li>
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
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-[17px]">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/hero" className="apple-link transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 inline-block no-underline">
                  Hero Page
                </Link>
              </li>
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
        <div className="mt-10 pt-6 border-t border-border/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="apple-body text-sm">
              &copy; {new Date().getFullYear()} Uyarvom. All rights reserved.
            </p>
            
            <div className="flex items-center gap-4">
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
          
          <div className="mt-4 text-center">
            <p className="apple-body text-xs">
              Made with care in India 🇮🇳 | Free shipping on orders over ₹999
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
