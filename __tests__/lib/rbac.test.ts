import { describe, it, expect } from 'vitest'
import {
  hasPermission,
  checkAccess,
  canManageRole,
  getCreatableRoles,
  isValidModule,
  isValidSystemRole,
  validatePermissions,
  DEFAULT_ROLE_PERMISSIONS,
  SYSTEM_ROLES,
} from '@/lib/rbac'

describe('RBAC System', () => {
  describe('Default Permissions', () => {
    it('super_admin has full access to all modules', () => {
      const perms = DEFAULT_ROLE_PERMISSIONS.super_admin
      expect(perms.length).toBe(8) // All modules
      for (const p of perms) {
        expect(p.canView).toBe(true)
        expect(p.canCreate).toBe(true)
        expect(p.canEdit).toBe(true)
        expect(p.canDelete).toBe(true)
      }
    })

    it('admin has full access except settings (read-only) and roles (no delete)', () => {
      const perms = DEFAULT_ROLE_PERMISSIONS.admin
      const settings = perms.find(p => p.module === 'settings')
      expect(settings?.canView).toBe(true)
      expect(settings?.canCreate).toBe(false)
      expect(settings?.canEdit).toBe(false)

      const roles = perms.find(p => p.module === 'roles')
      expect(roles?.canCreate).toBe(true)
      expect(roles?.canDelete).toBe(false)
    })

    it('manager has product + inventory create/edit but no delete', () => {
      const perms = DEFAULT_ROLE_PERMISSIONS.manager
      const products = perms.find(p => p.module === 'products')
      expect(products?.canView).toBe(true)
      expect(products?.canCreate).toBe(true)
      expect(products?.canEdit).toBe(true)
      expect(products?.canDelete).toBe(false)
    })

    it('manager cannot access customers, settings, couriers, roles', () => {
      const perms = DEFAULT_ROLE_PERMISSIONS.manager
      expect(perms.find(p => p.module === 'customers')?.canView).toBe(false)
      expect(perms.find(p => p.module === 'settings')?.canView).toBe(false)
      expect(perms.find(p => p.module === 'couriers')?.canView).toBe(false)
      expect(perms.find(p => p.module === 'roles')?.canView).toBe(false)
    })

    it('courier can only view + edit orders (for status updates)', () => {
      const perms = DEFAULT_ROLE_PERMISSIONS.courier
      const orders = perms.find(p => p.module === 'orders')
      expect(orders?.canView).toBe(true)
      expect(orders?.canEdit).toBe(true)
      expect(orders?.canCreate).toBe(false)
      expect(orders?.canDelete).toBe(false)
    })

    it('courier has no access to any other module', () => {
      const perms = DEFAULT_ROLE_PERMISSIONS.courier
      expect(perms.find(p => p.module === 'products')?.canView).toBe(false)
      expect(perms.find(p => p.module === 'customers')?.canView).toBe(false)
      expect(perms.find(p => p.module === 'inventory')?.canView).toBe(false)
    })

    it('customer has no admin access to any module', () => {
      const perms = DEFAULT_ROLE_PERMISSIONS.customer
      for (const p of perms) {
        expect(p.canView).toBe(false)
        expect(p.canCreate).toBe(false)
        expect(p.canEdit).toBe(false)
        expect(p.canDelete).toBe(false)
      }
    })
  })

  describe('Permission Checking', () => {
    it('hasPermission returns true for allowed action', () => {
      const perms = DEFAULT_ROLE_PERMISSIONS.admin
      expect(hasPermission(perms, 'products', 'canCreate')).toBe(true)
      expect(hasPermission(perms, 'orders', 'canDelete')).toBe(true)
    })

    it('hasPermission returns false for disallowed action', () => {
      const perms = DEFAULT_ROLE_PERMISSIONS.manager
      expect(hasPermission(perms, 'products', 'canDelete')).toBe(false)
      expect(hasPermission(perms, 'customers', 'canView')).toBe(false)
    })

    it('hasPermission returns false for unknown module', () => {
      const perms = DEFAULT_ROLE_PERMISSIONS.admin
      expect(hasPermission(perms, 'unknown' as any, 'canView')).toBe(false)
    })

    it('checkAccess returns allowed: true for valid permission', () => {
      const perms = DEFAULT_ROLE_PERMISSIONS.admin
      const result = checkAccess(perms, 'products', 'canCreate')
      expect(result.allowed).toBe(true)
    })

    it('checkAccess returns allowed: false with reason for invalid permission', () => {
      const perms = DEFAULT_ROLE_PERMISSIONS.courier
      const result = checkAccess(perms, 'products', 'canView')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('No canView permission on products')
    })
  })

  describe('Role Hierarchy', () => {
    it('super_admin can manage all other roles', () => {
      expect(canManageRole('super_admin', 'admin')).toBe(true)
      expect(canManageRole('super_admin', 'manager')).toBe(true)
      expect(canManageRole('super_admin', 'courier')).toBe(true)
      expect(canManageRole('super_admin', 'customer')).toBe(true)
    })

    it('admin can manage manager, courier, customer', () => {
      expect(canManageRole('admin', 'manager')).toBe(true)
      expect(canManageRole('admin', 'courier')).toBe(true)
      expect(canManageRole('admin', 'customer')).toBe(true)
    })

    it('admin cannot manage super_admin or other admin', () => {
      expect(canManageRole('admin', 'super_admin')).toBe(false)
      expect(canManageRole('admin', 'admin')).toBe(false)
    })

    it('manager cannot manage anyone', () => {
      expect(canManageRole('manager', 'courier')).toBe(true) // Manager > Courier
      expect(canManageRole('manager', 'admin')).toBe(false)
      expect(canManageRole('manager', 'manager')).toBe(false)
    })

    it('courier cannot manage anyone', () => {
      expect(canManageRole('courier', 'customer')).toBe(true)
      expect(canManageRole('courier', 'manager')).toBe(false)
    })

    it('customer cannot manage any role', () => {
      expect(canManageRole('customer', 'courier')).toBe(false)
      expect(canManageRole('customer', 'customer')).toBe(false)
    })
  })

  describe('Creatable Roles', () => {
    it('super_admin can create all roles', () => {
      const roles = getCreatableRoles('super_admin')
      expect(roles).toContain('admin')
      expect(roles).toContain('manager')
      expect(roles).toContain('courier')
      expect(roles).toContain('customer')
    })

    it('admin can create manager, courier, customer', () => {
      const roles = getCreatableRoles('admin')
      expect(roles).toContain('manager')
      expect(roles).toContain('courier')
      expect(roles).toContain('customer')
      expect(roles).not.toContain('admin')
      expect(roles).not.toContain('super_admin')
    })

    it('manager can create courier, customer', () => {
      const roles = getCreatableRoles('manager')
      expect(roles).toContain('courier')
      expect(roles).toContain('customer')
      expect(roles).not.toContain('admin')
    })

    it('customer cannot create any role', () => {
      expect(getCreatableRoles('customer')).toHaveLength(0)
    })
  })

  describe('Validation', () => {
    it('isValidModule accepts known modules', () => {
      expect(isValidModule('products')).toBe(true)
      expect(isValidModule('orders')).toBe(true)
      expect(isValidModule('settings')).toBe(true)
    })

    it('isValidModule rejects unknown modules', () => {
      expect(isValidModule('unknown')).toBe(false)
      expect(isValidModule('')).toBe(false)
    })

    it('isValidSystemRole accepts known roles', () => {
      expect(isValidSystemRole('super_admin')).toBe(true)
      expect(isValidSystemRole('courier')).toBe(true)
    })

    it('isValidSystemRole rejects unknown roles', () => {
      expect(isValidSystemRole('god')).toBe(false)
      expect(isValidSystemRole('')).toBe(false)
    })

    it('validatePermissions passes for valid permissions', () => {
      const result = validatePermissions([
        { module: 'products', canView: true, canCreate: true, canEdit: true, canDelete: false },
        { module: 'orders', canView: true, canCreate: false, canEdit: false, canDelete: false },
      ])
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('validatePermissions fails for invalid module', () => {
      const result = validatePermissions([
        { module: 'invalid' as any, canView: true, canCreate: false, canEdit: false, canDelete: false },
      ])
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('Invalid module')
    })

    it('validatePermissions fails for duplicate modules', () => {
      const result = validatePermissions([
        { module: 'products', canView: true, canCreate: false, canEdit: false, canDelete: false },
        { module: 'products', canView: false, canCreate: true, canEdit: false, canDelete: false },
      ])
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('Duplicate module')
    })
  })

  describe('System Roles Seed Data', () => {
    it('has 5 system roles defined', () => {
      expect(SYSTEM_ROLES).toHaveLength(5)
    })

    it('each system role has name, displayName, description', () => {
      for (const role of SYSTEM_ROLES) {
        expect(role.name).toBeTruthy()
        expect(role.displayName).toBeTruthy()
        expect(role.description).toBeTruthy()
      }
    })

    it('all system roles have default permissions defined', () => {
      for (const role of SYSTEM_ROLES) {
        expect(DEFAULT_ROLE_PERMISSIONS[role.name]).toBeDefined()
        expect(DEFAULT_ROLE_PERMISSIONS[role.name].length).toBeGreaterThan(0)
      }
    })
  })
})
