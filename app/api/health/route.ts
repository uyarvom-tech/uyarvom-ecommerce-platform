import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAdminAccess } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Use a local client to avoid top-level failures from the shared lib if it's corrupted
const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  const authResult = await requireAdminAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Database connection timeout')), 5000)),
    ])

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      { status: 'error', message: 'Service unavailable' },
      { status: 503 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
