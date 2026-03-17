import type { User as SupabaseUser } from "@supabase/supabase-js"
import { prisma } from "@/lib/prisma"

function getFullName(user: SupabaseUser) {
  const metadataName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.display_name

  if (typeof metadataName === "string" && metadataName.trim()) {
    return metadataName.trim()
  }

  if (user.email) {
    return user.email.split("@")[0]
  }

  return "User"
}

export async function syncAuthUserToPrisma(user: SupabaseUser) {
  if (!user.email) {
    throw new Error("Authenticated user is missing an email address")
  }

  return prisma.user.upsert({
    where: { id: user.id },
    update: {
      email: user.email,
      fullName: getFullName(user),
      avatarUrl: user.user_metadata?.avatar_url || null,
    },
    create: {
      id: user.id,
      email: user.email,
      fullName: getFullName(user),
      avatarUrl: user.user_metadata?.avatar_url || null,
    },
  })
}
