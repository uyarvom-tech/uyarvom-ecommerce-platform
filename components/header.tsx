import Link from "next/link"
import Image from "next/image"
import { AuthButton } from "@/components/auth-button"
import { HeaderCartButton } from "@/components/header-cart-button"
import { HeaderWishlistButton } from "@/components/header-wishlist-button"
import { ProductsSearch } from "@/components/products-search"
import { MobileHeaderChrome } from "@/components/mobile-header-chrome"

export async function Header() {
  return (
    <div className="m-0 flex w-full flex-col gap-0">
      <div className="m-0 w-full border-0 bg-[#111111] px-4 py-1.5 text-white sm:px-6 md:py-2">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between text-[8px] font-bold uppercase leading-none tracking-[0.18em] md:text-[9px] md:tracking-[0.2em]">
          <div className="flex items-center gap-3 md:gap-8">
            <div className="flex items-center gap-2">
              <span className="text-primary">{"\u2022"}</span>
              <span>Free Shipping Over {"\u20B9"}4,999</span>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <span className="text-primary">{"\u2022"}</span>
              <span>0% EMI Options Available</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-white/50 md:gap-6">
            <Link href="/delivery" className="transition-colors hover:text-primary">
              Delivery Info
            </Link>
            <Link href="/track" className="hidden transition-colors hover:text-primary sm:block">
              Track Order
            </Link>
            <Link href="/support" className="transition-colors hover:text-primary">
              Help
            </Link>
          </div>
        </div>
      </div>

      <MobileHeaderChrome />

      <div className="hidden lg:block">
        <header className="m-0 w-full border-0 bg-[#faf8f2]/95 shadow-none backdrop-blur-md">
          <div className="mx-auto max-w-[1400px] px-4 py-2 sm:px-6 md:py-2.5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center justify-between gap-3 xl:min-w-[300px]">
                <Link href="/" className="group flex items-center gap-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full border border-primary/10 bg-white shadow-sm transition-all duration-500 group-hover:border-primary/30 md:h-12 md:w-12">
                    <Image
                      src="/logos/logo.png"
                      alt="Uyarvom"
                      fill
                      className="object-contain p-1 transition-transform duration-500 group-hover:scale-105"
                      priority
                    />
                  </div>
                  <div className="min-w-0 leading-none">
                    <span className="block font-serif text-[1.45rem] tracking-[0.08em] text-[#6b140f] md:text-[2rem]">
                      Uyarvom
                    </span>
                    <span className="mt-0.5 block font-serif text-[0.82rem] tracking-[0.2em] text-[#b48a2b] md:text-[1.05rem]">
                      Homestyles
                    </span>
                  </div>
                </Link>
              </div>

              <div className="min-w-0 flex-1 xl:px-4">
                <div className="mx-auto max-w-[760px]">
                  <ProductsSearch />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 md:gap-4 xl:min-w-[260px]">
                <HeaderWishlistButton />
                <HeaderCartButton />
                <div className="hidden h-8 w-px bg-border/30 md:block" />
                <AuthButton />
              </div>
            </div>
          </div>
        </header>

        <div className="m-0 w-full border-0 bg-[#FAF9F6] py-2">
          <div className="mx-auto flex max-w-[1400px] items-center justify-center gap-3 px-4 text-[9px] font-bold uppercase leading-none tracking-[0.28em] sm:px-6 md:text-[10px]">
            <Link href="/offers" className="group flex items-center gap-3">
              <span className="text-foreground/40">First Order Offer:</span>
              <span className="text-foreground transition-colors group-hover:text-primary">
                Save <span className="italic text-primary">{"\u20B9"}500</span> on your first purchase
              </span>
              <span className="animate-pulse text-primary">{"\u2192"}</span>
              <span className="bg-primary/10 px-3 py-1 font-mono text-[8px] tracking-normal text-primary">
                CODE: ARTVOM500
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
