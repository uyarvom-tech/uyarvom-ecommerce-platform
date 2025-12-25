import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { GlobalClickSpark } from "@/components/global-click-spark"
import { FloatingAIButton } from "@/components/floating-ai-button"
import "./globals.css"

export const metadata: Metadata = {
  title: "Uyarvom - Premium Ceramic Houseware",
  description: "Discover handcrafted ceramic cookware, bakeware, and dinnerware for modern kitchens",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
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
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
