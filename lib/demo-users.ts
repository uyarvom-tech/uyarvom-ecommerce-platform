// Demo data for development when Supabase is not configured
// Using static timestamp to prevent hydration mismatches
const DEMO_TIMESTAMP = "2024-01-01T00:00:00.000Z"

export interface DemoUser {
  id: string
  email: string
  password: string
  role: 'admin' | 'customer' | 'staff'
  full_name: string
  phone?: string
  created_at: string
}

export const demoUsers: DemoUser[] = [
  // Admin Users
  {
    id: 'admin-001',
    email: 'admin@uyarvom.com',
    password: 'admin123',
    role: 'admin',
    full_name: 'Admin User',
    phone: '+91 98765 43210',
    created_at: DEMO_TIMESTAMP
  },
  {
    id: 'admin-002',
    email: 'superadmin@uyarvom.com',
    password: 'super123',
    role: 'admin',
    full_name: 'Super Admin',
    phone: '+91 98765 43211',
    created_at: DEMO_TIMESTAMP
  },

  // Staff Users
  {
    id: 'staff-001',
    email: 'staff@uyarvom.com',
    password: 'staff123',
    role: 'staff',
    full_name: 'Staff Member',
    phone: '+91 98765 43212',
    created_at: DEMO_TIMESTAMP
  },
  {
    id: 'staff-002',
    email: 'manager@uyarvom.com',
    password: 'manager123',
    role: 'staff',
    full_name: 'Store Manager',
    phone: '+91 98765 43213',
    created_at: DEMO_TIMESTAMP
  },

  // Customer Users
  {
    id: 'customer-001',
    email: 'customer@example.com',
    password: 'customer123',
    role: 'customer',
    full_name: 'John Customer',
    phone: '+91 98765 43214',
    created_at: DEMO_TIMESTAMP
  },
  {
    id: 'customer-002',
    email: 'jane@example.com',
    password: 'jane123',
    role: 'customer',
    full_name: 'Jane Smith',
    phone: '+91 98765 43215',
    created_at: DEMO_TIMESTAMP
  },
  {
    id: 'customer-003',
    email: 'demo@example.com',
    password: 'demo123',
    role: 'customer',
    full_name: 'Demo User',
    phone: '+91 98765 43216',
    created_at: DEMO_TIMESTAMP
  }
]

// Helper function to find user by email and password
export function authenticateUser(email: string, password: string): DemoUser | null {
  return demoUsers.find(user => user.email === email && user.password === password) || null
}

// Helper function to get user by ID
export function getUserById(id: string): DemoUser | null {
  return demoUsers.find(user => user.id === id) || null
}

// Helper function to check if user has admin role
export function isAdmin(user: DemoUser | null): boolean {
  return user?.role === 'admin'
}

// Helper function to check if user has staff role
export function isStaff(user: DemoUser | null): boolean {
  return user?.role === 'staff'
}

// Helper function to check if user has customer role
export function isCustomer(user: DemoUser | null): boolean {
  return user?.role === 'customer'
}

// Helper function to check if user can access admin features
export function canAccessAdmin(user: DemoUser | null): boolean {
  return user?.role === 'admin' || user?.role === 'staff'
}