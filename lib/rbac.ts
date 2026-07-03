/**
 * Role-Based Access Control (RBAC) — Core business logic
 * Granular permission system with custom roles.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type SystemRole = 'super_admin' | 'admin' | 'manager' | 'courier' | 'customer'

export type Module = 'products' | 'orders' | 'customers' | 'inventory' | 'reports' | 'settings' | 'couriers' | 'roles'

export type Permission = 'canView' | 'canCreate' | 'canEdit' | 'canDelete'

export interface RolePermissionSet {
  module: Module
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}

// ─── Default Permission Sets ─────────────────────────────────────────────────

const ALL_MODULES: Module[] = ['products', 'orders', 'customers', 'inventory', 'reports', 'settings', 'couriers', 'roles']

function fullAccess(module: Module): RolePermissionSet {
  return { module, canView: true, canCreate: true, canEdit: true, canDelete: true }
}

function readOnly(module: Module): RolePermissionSet {
  return { module, canView: true, canCreate: false, canEdit: false, canDelete: false }
}

function noAccess(module: Module): RolePermissionSet {
  return { module, canView: false, canCreate: false, canEdit: false, canDelete: false }
}

function createEdit(module: Module): RolePermissionSet {
  return { module, canView: true, canCreate: true, canEdit: true, canDelete: false }
}

/** Default permission sets for system roles */
export const DEFAULT_ROLE_PERMISSIONS: Record<SystemRole, RolePermissionSet[]> = {
  super_admin: ALL_MODULES.map(fullAccess),
  admin: [
    fullAccess('products'),
    fullAccess('orders'),
    fullAccess('customers'),
    fullAccess('inventory'),
    fullAccess('reports'),
    readOnly('settings'),
    fullAccess('couriers'),
    createEdit('roles'),
  ],
  manager: [
    createEdit('products'),
    readOnly('orders'),
    noAccess('customers'),
    createEdit('inventory'),
    readOnly('reports'),
    noAccess('settings'),
    noAccess('couriers'),
    noAccess('roles'),
  ],
  courier: [
    noAccess('products'),
    { module: 'orders', canView: true, canCreate: false, canEdit: true, canDelete: false }, // Can update delivery status
    noAccess('customers'),
    noAccess('inventory'),
    noAccess('reports'),
    noAccess('settings'),
    noAccess('couriers'),
    noAccess('roles'),
  ],
  customer: ALL_MODULES.map(noAccess), // Customer uses storefront, not admin
}

// ─── Permission Checking ─────────────────────────────────────────────────────

/**
 * Check if a role has a specific permission on a module.
 */
export function hasPermission(
  permissions: RolePermissionSet[],
  module: Module,
  action: Permission,
): boolean {
  const modulePerm = permissions.find(p => p.module === module)
  if (!modulePerm) return false
  return modulePerm[action]
}

/**
 * Check if a role can perform an action. Returns true/false.
 */
export function checkAccess(
  userPermissions: RolePermissionSet[],
  module: Module,
  action: Permission,
): { allowed: boolean; reason?: string } {
  const allowed = hasPermission(userPermissions, module, action)
  if (!allowed) {
    return { allowed: false, reason: `No ${action} permission on ${module}` }
  }
  return { allowed: true }
}

// ─── Role Hierarchy ──────────────────────────────────────────────────────────

const ROLE_HIERARCHY: Record<SystemRole, number> = {
  super_admin: 100,
  admin: 80,
  manager: 60,
  courier: 40,
  customer: 20,
}

/**
 * Check if a role can manage (create/edit/delete) another role.
 * A role can only manage roles below it in the hierarchy.
 */
export function canManageRole(actorRole: SystemRole, targetRole: SystemRole): boolean {
  return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole]
}

/**
 * Get the list of roles that a given role can create.
 */
export function getCreatableRoles(actorRole: SystemRole): SystemRole[] {
  const actorLevel = ROLE_HIERARCHY[actorRole]
  return (Object.entries(ROLE_HIERARCHY) as [SystemRole, number][])
    .filter(([_, level]) => level < actorLevel)
    .map(([role]) => role)
}

// ─── Role Validation ─────────────────────────────────────────────────────────

export function isValidModule(module: string): module is Module {
  return ALL_MODULES.includes(module as Module)
}

export function isValidSystemRole(role: string): role is SystemRole {
  return ['super_admin', 'admin', 'manager', 'courier', 'customer'].includes(role)
}

/**
 * Validate a permission set — all modules must be valid.
 */
export function validatePermissions(permissions: RolePermissionSet[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const modules = new Set<string>()

  for (const perm of permissions) {
    if (!isValidModule(perm.module)) {
      errors.push(`Invalid module: ${perm.module}`)
    }
    if (modules.has(perm.module)) {
      errors.push(`Duplicate module: ${perm.module}`)
    }
    modules.add(perm.module)
  }

  return { valid: errors.length === 0, errors }
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

export const SYSTEM_ROLES: Array<{ name: SystemRole; displayName: string; description: string }> = [
  { name: 'super_admin', displayName: 'Super Admin', description: 'Full system access — no restrictions' },
  { name: 'admin', displayName: 'Admin', description: 'Full operational access; cannot modify Super Admin settings' },
  { name: 'manager', displayName: 'Manager', description: 'Product, inventory, and partial order access' },
  { name: 'courier', displayName: 'Courier', description: 'Shipment status updates only' },
  { name: 'customer', displayName: 'Customer', description: 'Shopping, cart, checkout, order history' },
]
