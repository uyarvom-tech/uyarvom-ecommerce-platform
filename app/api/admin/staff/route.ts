import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminAccess } from "@/lib/auth-middleware"
import { supabaseAdmin } from "@/lib/supabase-server"

async function ensureActiveAdmin(request: NextRequest) {
  const authResult = await requireAdminAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const adminUser = await prisma.adminUser.findUnique({
    where: { userId: authResult.authUser.id },
    select: { isActive: true },
  })

  if (!adminUser?.isActive) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return authResult
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await ensureActiveAdmin(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const staff = await prisma.user.findMany({
      where: {
        adminProfile: {
          isNot: null,
        },
      },
      include: {
        adminProfile: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const transformedStaff = staff.map((member) => ({
      id: member.id,
      email: member.email,
      fullName: member.fullName || "Unidentified Personnel",
      avatarUrl: member.avatarUrl,
      role: member.adminProfile?.role || "staff",
      createdAt: member.createdAt,
      lastLogin: member.adminProfile?.lastActiveAt || member.updatedAt,
      isActive: member.adminProfile?.isActive ?? true,
    }))

    return NextResponse.json({ staff: transformedStaff })
  } catch (error) {
    console.error("Staff fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch staff members" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await ensureActiveAdmin(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { email, fullName, role, password } = await request.json()

    if (!email || !fullName || !role || !password) {
      return NextResponse.json(
        { error: "Email, full name, role, and password are required" },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    const validRoles = ["staff", "admin"]
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be staff or admin" },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      )
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || "Failed to create auth user" },
        { status: 400 }
      )
    }

    const userId = authData.user.id

    await prisma.$transaction([
      prisma.user.create({
        data: {
          id: userId,
          email,
          fullName,
        },
      }),
      prisma.adminUser.create({
        data: {
          userId,
          role,
        },
      }),
    ])

    return NextResponse.json({
      message: "Staff member created successfully",
      staff: {
        id: userId,
        email,
        fullName,
        role,
        avatarUrl: null,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isActive: true,
      },
    })
  } catch (error: any) {
    console.error("Staff creation error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create staff member" },
      { status: 500 }
    )
  }
}
