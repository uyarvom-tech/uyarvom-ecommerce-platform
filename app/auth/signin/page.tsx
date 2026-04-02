import { redirect } from "next/navigation"

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const params = await searchParams
  const message = params?.message?.toLowerCase() || ""

  if (message.includes("admin")) {
    redirect("/auth/admin-login")
  }

  redirect("/auth/login")
}
