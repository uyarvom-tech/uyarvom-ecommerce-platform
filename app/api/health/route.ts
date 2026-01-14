import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-safe'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
      env: {
        hasDbUrl: !!process.env.DATABASE_URL,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasR2Config: !!process.env.R2_ACCOUNT_ID,
        nodeEnv: process.env.NODE_ENV,
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString(),
      env: {
        hasDbUrl: !!process.env.DATABASE_URL,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasR2Config: !!process.env.R2_ACCOUNT_ID,
        nodeEnv: process.env.NODE_ENV,
      }
    }, { status: 500 })
  }
}
