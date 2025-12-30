import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import { SecretThemeProvider } from "@/components/secret-theme-provider"
import { GlobalClickSpark } from "@/components/global-click-spark"
import { FloatingAIButton } from "@/components/floating-ai-button"
import "./globals.css"

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
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className="font-sans antialiased">
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
