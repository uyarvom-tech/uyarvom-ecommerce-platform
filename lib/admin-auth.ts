import { getCurrentUserContext } from "@/lib/auth-middleware"

export async function getCurrentUser() {
  try {
    const context = await getCurrentUserContext()
    return context?.dbUser || null
  } catch (error) {
    console.error("Get current user error:", error)
    return null
  }
}

export async function isCurrentUserAdmin() {
  try {
    const context = await getCurrentUserContext()
    return ["admin", "super_admin"].includes(context?.role || "")
  } catch (error) {
    console.error("Admin check error:", error)
    return false
  }
}

export async function getCurrentUserAdminRole() {
  try {
    const context = await getCurrentUserContext()
    return context?.role && ["admin", "super_admin"].includes(context.role)
      ? context.role
      : null
  } catch (error) {
    console.error("Admin role check error:", error)
    return null
  }
}
