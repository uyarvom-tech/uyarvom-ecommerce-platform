import type React from "react"
import type { Metadata } from "next"
import { Lato, Playfair_Display } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import { SecretThemeProvider } from "@/components/secret-theme-provider"
import { FloatingAIButton } from "@/components/floating-ai-button"
import "./globals.css"

const lato = Lato({
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
  variable: "--font-lato",
  display: "swap",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Uyarvom - Homestyles",
  description: "Discover handcrafted ceramic cookware, bakeware, and dinnerware for modern kitchens",
  generator: "v0.app",
  icons: {
    icon: "/logos/logo.png",
    apple: "/logos/logo.png",
    shortcut: "/logos/logo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`scroll-smooth ${lato.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body className={`${lato.className} antialiased`}>
        <SecretThemeProvider>
          {children}
          <FloatingAIButton />
          <Toaster
            position="bottom-right"
            expand={false}
            toastOptions={{
              style: {
                background: 'rgb(var(--background))',
                color: 'rgb(var(--foreground))',
                border: '1px solid rgb(var(--primary) / 0.2)',
                borderRadius: '0px',
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                padding: '16px 24px',
              },
            }}
          />
        </SecretThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
