"use client"

import { DemoUser, authenticateUser, getUserById } from './demo-users'

// Simple session management for demo mode
class DemoAuthManager {
  private currentUser: DemoUser | null = null
  private listeners: ((user: DemoUser | null) => void)[] = []

  constructor() {
    // Load user from localStorage on initialization
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('demo-user')
      if (savedUser) {
        try {
          this.currentUser = JSON.parse(savedUser)
          // Also set cookie for server-side access
          document.cookie = `demo-user=${savedUser}; path=/; max-age=86400`
        } catch (e) {
          localStorage.removeItem('demo-user')
        }
      }
    }
  }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<{ user: DemoUser | null; error: string | null }> {
    const user = authenticateUser(email, password)
    
    if (user) {
      this.currentUser = user
      if (typeof window !== 'undefined') {
        const userJson = JSON.stringify(user)
        localStorage.setItem('demo-user', userJson)
        // Set cookie for server-side access
        document.cookie = `demo-user=${userJson}; path=/; max-age=86400`
      }
      this.notifyListeners()
      return { user, error: null }
    }
    
    return { user: null, error: 'Invalid email or password' }
  }

  // Sign out
  async signOut(): Promise<void> {
    this.currentUser = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('demo-user')
      // Clear cookie
      document.cookie = 'demo-user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
    this.notifyListeners()
  }

  // Get current user
  getCurrentUser(): DemoUser | null {
    return this.currentUser
  }

  // Subscribe to auth state changes
  onAuthStateChange(callback: (user: DemoUser | null) => void): () => void {
    this.listeners.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  // Notify all listeners of auth state change
  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.currentUser))
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.currentUser !== null
  }

  // Check user role
  hasRole(role: 'admin' | 'customer' | 'staff'): boolean {
    return this.currentUser?.role === role
  }

  // Check if user can access admin features
  canAccessAdmin(): boolean {
    return this.currentUser?.role === 'admin' || this.currentUser?.role === 'staff'
  }
}

// Create singleton instance
export const demoAuth = new DemoAuthManager()

// Hook for React components
export function useDemoAuth() {
  return demoAuth
}