import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

function isAuthorizedCron(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization") || ""
  const userAgent = request.headers.get("user-agent") || ""

  if (cronSecret) {
    return authHeader === `Bearer ${cronSecret}`
  }

  return userAgent.includes("vercel-cron/1.0")
}

export async function GET(request: NextRequest) {
  const startedAt = new Date()

  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const staleCartCutoffDays = Number(process.env.CRON_CART_RETENTION_DAYS || "30")
    const staleCartCutoff = new Date()
    staleCartCutoff.setDate(staleCartCutoff.getDate() - staleCartCutoffDays)

    const deletedCartItemsResult = await prisma.cartItem.deleteMany({
      where: {
        updatedAt: {
          lt: staleCartCutoff,
        },
      },
    })

    try {
      await prisma.auditLog.create({
        data: {
          actorId: null,
          entityType: "cron",
          entityId: "cleanup",
          action: "run",
          description: `Cleanup ran at ${startedAt.toISOString()}`,
          metadataJson: JSON.stringify({
            deletedCartItems: deletedCartItemsResult.count,
            staleCartCutoffDays,
            startedAt: startedAt.toISOString(),
            finishedAt: new Date().toISOString(),
          }),
        },
      })
    } catch (logError) {
      console.warn("Cron cleanup ran, but audit log write failed:", logError)
    }

    console.log("Cron cleanup completed", {
      deletedCartItems: deletedCartItemsResult.count,
      staleCartCutoffDays,
      startedAt: startedAt.toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: "Cleanup completed",
      deletedCartItems: deletedCartItemsResult.count,
      staleCartCutoffDays,
    })
  } catch (error: any) {
    console.error("Cron cleanup failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Cleanup failed",
      },
      { status: 500 }
    )
  }
}
