import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-lg font-bold">Uyarvom</h3>
            <p className="text-sm text-muted-foreground">
              Premium ceramic houseware for modern kitchens. Quality craftsmanship, timeless design.
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/products" className="text-muted-foreground transition-colors hover:text-foreground">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-muted-foreground transition-colors hover:text-foreground">
                  Categories
                </Link>
              </li>
              <li>
                <Link
                  href="/products?featured=true"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Featured
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/contact" className="text-muted-foreground transition-colors hover:text-foreground">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-muted-foreground transition-colors hover:text-foreground">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-muted-foreground transition-colors hover:text-foreground">
                  Returns
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground transition-colors hover:text-foreground">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground transition-colors hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground transition-colors hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Uyarvom. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
