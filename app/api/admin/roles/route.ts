import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'
import { DEFAULT_ROLE_PERMISSIONS, SYSTEM_ROLES, validatePermissions, canManageRole, type SystemRole } from '@/lib/rbac'

/**
 * GET /api/admin/roles — List all roles with permissions
 * POST /api/admin/roles — Create a new custom role (or seed system roles)
 */
export async function GET(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const roles = await prisma.role.findMany({
      include: { permissions: true, _count: { select: { userRoles: true } } },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ roles })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const { name, displayName, description, permissions, seedSystemRoles } = body

    // Seed system roles (one-time setup)
    if (seedSystemRoles) {
      const results = []
      for (const sysRole of SYSTEM_ROLES) {
        const existing = await prisma.role.findUnique({ where: { name: sysRole.name } })
        if (existing) { results.push({ name: sysRole.name, status: 'exists' }); continue }

        const role = await prisma.role.create({
          data: {
            name: sysRole.name,
            displayName: sysRole.displayName,
            description: sysRole.description,
            isSystem: true,
            permissions: {
              create: DEFAULT_ROLE_PERMISSIONS[sysRole.name].map(p => ({
                module: p.module,
                canView: p.canView,
                canCreate: p.canCreate,
                canEdit: p.canEdit,
                canDelete: p.canDelete,
              })),
            },
          },
        })
        results.push({ name: sysRole.name, status: 'created', id: role.id })
      }
      return NextResponse.json({ seeded: results })
    }

    // Create custom role
    if (!name || !displayName) {
      return NextResponse.json({ error: 'name and displayName are required' }, { status: 400 })
    }

    const existing = await prisma.role.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json({ error: 'Role name already exists' }, { status: 400 })
    }

    if (permissions) {
      const validation = validatePermissions(permissions)
      if (!validation.valid) {
        return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 })
      }
    }

    const role = await prisma.role.create({
      data: {
        name,
        displayName,
        description: description || null,
        isSystem: false,
        createdBy: (authResult as any).authUser?.id || null,
        permissions: permissions ? {
          create: permissions.map((p: any) => ({
            module: p.module,
            canView: p.canView || false,
            canCreate: p.canCreate || false,
            canEdit: p.canEdit || false,
            canDelete: p.canDelete || false,
          })),
        } : undefined,
      },
      include: { permissions: true },
    })

    return NextResponse.json(role, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create role' }, { status: 500 })
  }
}
