import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Skeleton } from "@/components/ui/skeleton"

export default function SearchLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30 px-6 py-12">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <Skeleton className="mx-auto mb-6 h-12 w-96" />
            <Skeleton className="mx-auto mb-8 h-6 w-[600px]" />
            <Skeleton className="mx-auto h-14 w-full max-w-3xl" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
