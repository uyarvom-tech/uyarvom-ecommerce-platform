import { NextRequest, NextResponse } from "next/server"
import { requireAuthenticatedUser } from "@/lib/auth-middleware"
import { prisma } from "@/lib/prisma"

function selectProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

export async function GET(request: NextRequest) {
  const authResult = await requireAuthenticatedUser(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const user = await selectProfile(authResult.dbUser.id)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await requireAuthenticatedUser(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const data = await request.json()
    const { fullName, avatarUrl } = data

    const updatedUser = await prisma.user.update({
      where: { id: authResult.dbUser.id },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user profile:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
