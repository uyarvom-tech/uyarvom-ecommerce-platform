import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'
import { validatePermissions } from '@/lib/rbac'

/**
 * GET /api/admin/roles/[id] — Get role detail with permissions
 * PUT /api/admin/roles/[id] — Update role permissions
 * DELETE /api/admin/roles/[id] — Delete custom role (system roles protected)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params
  try {
    const role = await prisma.role.findUnique({ where: { id }, include: { permissions: true, _count: { select: { userRoles: true } } } })
    if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    return NextResponse.json(role)
  } catch { return NextResponse.json({ error: 'Failed to fetch role' }, { status: 500 }) }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params
  try {
    const body = await request.json()
    const { displayName, description, permissions } = body

    const role = await prisma.role.findUnique({ where: { id } })
    if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 })

    if (permissions) {
      const validation = validatePermissions(permissions)
      if (!validation.valid) return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 })

      // Delete existing and replace
      await prisma.rolePermission.deleteMany({ where: { roleId: id } })
      await prisma.rolePermission.createMany({
        data: permissions.map((p: any) => ({ roleId: id, module: p.module, canView: p.canView || false, canCreate: p.canCreate || false, canEdit: p.canEdit || false, canDelete: p.canDelete || false })),
      })
    }

    const updated = await prisma.role.update({
      where: { id },
      data: { displayName: displayName || role.displayName, description: description !== undefined ? description : role.description },
      include: { permissions: true },
    })

    return NextResponse.json(updated)
  } catch (error: any) { return NextResponse.json({ error: error.message || 'Failed to update role' }, { status: 500 }) }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params
  try {
    const role = await prisma.role.findUnique({ where: { id } })
    if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    if (role.isSystem) return NextResponse.json({ error: 'System roles cannot be deleted' }, { status: 400 })

    await prisma.role.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Role deleted' })
  } catch (error: any) { return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 }) }
}
