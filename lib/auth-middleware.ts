import type { User as SupabaseUser } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { syncAuthUserToPrisma } from "@/lib/user-sync"

export type AppRole = "customer" | "staff" | "admin" | "super_admin"

export interface AuthContext {
  authUser: SupabaseUser
  dbUser: Awaited<ReturnType<typeof syncAuthUserToPrisma>>
  role: AppRole
}

export async function getCurrentUser() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export async function getCurrentUserContext(): Promise<AuthContext | null> {
  const authUser = await getCurrentUser()

  if (!authUser) {
    return null
  }

  const dbUser = await syncAuthUserToPrisma(authUser)
  const adminUser = await prisma.adminUser.findUnique({
    where: { userId: authUser.id },
    select: { role: true },
  })

  return {
    authUser,
    dbUser,
    role: (adminUser?.role || "customer") as AppRole,
  }
}

export async function getCurrentUserRole() {
  try {
    const context = await getCurrentUserContext()
    return context?.role || null
  } catch (error) {
    console.error("Error getting user role:", error)
    return null
  }
}

export async function requireAuthenticatedUser(_request?: NextRequest) {
  try {
    const context = await getCurrentUserContext()

    if (!context) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    return context
  } catch (error) {
    console.error("Error checking user session:", error)
    return NextResponse.json({ error: "Authentication error" }, { status: 500 })
  }
}

export async function requireStaffAccess(request?: NextRequest) {
  const authResult = await requireAuthenticatedUser(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  if (!["admin", "staff", "super_admin"].includes(authResult.role)) {
    return NextResponse.json({ error: "Staff access required" }, { status: 403 })
  }

  return authResult
}

export async function requireAdminAccess(request?: NextRequest) {
  const authResult = await requireAuthenticatedUser(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  if (!["admin", "super_admin"].includes(authResult.role)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  return authResult
}

export const requireAdmin = requireAdminAccess
export const requireAdminRole = requireAdminAccess

export async function checkAdminAccess() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const adminUser = await prisma.adminUser.findUnique({
      where: { userId: user.id },
      select: { role: true, isActive: true },
    })

    return !!adminUser && adminUser.isActive && ['admin', 'super_admin'].includes(adminUser.role)
  } catch (error) {
    console.error("Admin access check failed:", error)
    return false
  }
}
