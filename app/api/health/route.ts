import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Use a local client to avoid top-level failures from the shared lib if it's corrupted
const prisma = new PrismaClient()

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || ''
  const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@')

  const diagnostics: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    connection_details: maskedUrl,
    env: {
      hasDbUrl: !!process.env.DATABASE_URL,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      nodeEnv: process.env.NODE_ENV,
      vercelRegion: process.env.VERCEL_REGION,
    }
  }

  try {
    // Test database connection with a timeout
    const dbCheck = await Promise.race([
      prisma.$queryRaw`SELECT 1`.then(() => 'connected').catch((e) => `error: ${e.message}`),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Database connection timeout (5s)')), 5000))
    ])

    diagnostics.database = dbCheck
    if (dbCheck !== 'connected') {
      diagnostics.status = 'degraded'
    }

    return NextResponse.json(diagnostics)
  } catch (error: any) {
    diagnostics.status = 'error'
    diagnostics.database = 'disconnected'
    diagnostics.error = error.message

    return NextResponse.json(diagnostics, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
