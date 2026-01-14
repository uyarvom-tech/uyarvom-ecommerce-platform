import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'API is working',
    timestamp: new Date().toISOString(),
    env: {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV || 'local',
    }
  })
}
