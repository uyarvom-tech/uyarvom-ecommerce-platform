import type React from "react"
import type { Metadata } from "next"
import { Lato } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import { SecretThemeProvider } from "@/components/secret-theme-provider"
import { GlobalClickSpark } from "@/components/global-click-spark"
import { FloatingAIButton } from "@/components/floating-ai-button"
import "./globals.css"

const lato = Lato({
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
  variable: "--font-lato",
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
    <html lang="en" className={`scroll-smooth ${lato.variable}`} suppressHydrationWarning>
      <body className={`${lato.className} antialiased`}>
        <SecretThemeProvider>
          <GlobalClickSpark>
            {children}
          </GlobalClickSpark>
          <FloatingAIButton />
          <Toaster 
            position="bottom-right" 
            toastOptions={{
              style: {
                background: 'rgb(var(--card))',
                color: 'rgb(var(--card-foreground))',
                border: '1px solid rgb(var(--border))',
                borderRadius: '16px',
              },
            }}
          />
        </SecretThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
