import { cookies } from 'next/headers'
import { verifyToken, getUser } from './auth'

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (!token) {
      return null
    }

    const authUser = await verifyToken(token)
    if (!authUser) {
      return null
    }

    const user = await getUser(authUser.id)
    return user
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

export async function isCurrentUserAdmin() {
  try {
    const user = await getCurrentUser()
    // Demo auth: check if email is admin
    return user?.email === 'admin@uyarvom.com'
  } catch (error) {
    console.error('Admin check error:', error)
    return false
  }
}

export async function getCurrentUserAdminRole() {
  try {
    const user = await getCurrentUser()
    // Demo auth: return admin role for admin email
    return user?.email === 'admin@uyarvom.com' ? 'super_admin' : null
  } catch (error) {
    console.error('Admin role check error:', error)
    return null
  }
}