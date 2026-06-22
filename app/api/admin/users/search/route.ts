import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminAccess } from "@/lib/auth-middleware"

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminAccess(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")?.trim() || ""

    const users = await prisma.user.findMany({
      where: query
        ? {
            OR: [
              { email: { contains: query, mode: "insensitive" } },
              { fullName: { contains: query, mode: "insensitive" } },
            ],
          }
        : {},
      include: {
        adminProfile: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    return NextResponse.json({
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.adminProfile?.role || "customer",
        isStaff: !!user.adminProfile,
      })),
    })
  } catch (error) {
    console.error("User search error:", error)
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 })
  }
}
