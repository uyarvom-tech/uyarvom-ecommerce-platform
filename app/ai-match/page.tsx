import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AIKitchenMatch } from "@/components/ai-kitchen-match"
import { AppleReveal } from "@/components/apple-scroll-animations"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
  title: "AI Kitchen Match | Uyarvom",
  description: "Upload your kitchen photo and get AI-powered ceramic recommendations that match your style",
}

export default async function AIMatchPage() {
  const supabase = await createClient()

  // Fetch products for AI suggestions
  const { data: productsData } = await supabase
    .from("products")
    .select(
      `
      *,
      category:categories(name, slug),
      images:product_images(image_url, alt_text, is_primary)
    `,
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  const products = productsData || []

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="max-w-[1200px] mx-auto px-6">
          <AppleReveal>
            <AIKitchenMatch products={products || []} />
          </AppleReveal>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
