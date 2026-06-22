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

  // Try upsert by Supabase auth ID first
  try {
    return await prisma.user.upsert({
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
  } catch (e: any) {
    // P2002 = unique constraint violation (email already exists with different id)
    // This happens when beta DB was seeded from prod with different auth UUIDs
    if (e?.code === 'P2002') {
      return await prisma.user.update({
        where: { email: user.email },
        data: {
          id: user.id,
          fullName: getFullName(user),
          avatarUrl: user.user_metadata?.avatar_url || null,
        },
      })
    }
    throw e
  }
}
