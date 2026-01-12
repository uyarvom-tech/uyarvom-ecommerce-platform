// Demo users for development and testing
export const demoUsers = [
  {
    id: 'demo-admin-1',
    email: 'admin@uyarvom.com',
    password: 'admin123',
    full_name: 'Admin User',
    role: 'admin' as const,
    phone: '+1234567890'
  },
  {
    id: 'demo-superadmin-1',
    email: 'superadmin@uyarvom.com',
    password: 'super123',
    full_name: 'Super Admin',
    role: 'admin' as const,
    phone: '+1234567891'
  },
  {
    id: 'demo-staff-1',
    email: 'staff@uyarvom.com',
    password: 'staff123',
    full_name: 'Staff User',
    role: 'staff' as const,
    phone: '+1234567892'
  },
  {
    id: 'demo-manager-1',
    email: 'manager@uyarvom.com',
    password: 'manager123',
    full_name: 'Manager User',
    role: 'staff' as const,
    phone: '+1234567893'
  },
  {
    id: 'demo-customer-1',
    email: 'customer@example.com',
    password: 'customer123',
    full_name: 'Demo Customer',
    role: 'customer' as const,
    phone: '+1234567894'
  }
]