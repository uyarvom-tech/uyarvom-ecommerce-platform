import Link from "next/link"

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-semibold">Sign in failed</h1>
      <p className="text-muted-foreground">There was a problem signing you in. Please try again.</p>
      <Link href="/" className="underline text-sm">Go back home</Link>
    </div>
  )
}
