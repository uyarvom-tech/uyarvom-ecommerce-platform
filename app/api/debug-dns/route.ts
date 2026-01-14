import { NextResponse } from 'next/server'
import dns from 'dns'
import { promisify } from 'util'

const resolve4 = promisify(dns.resolve4)

export const dynamic = 'force-dynamic'

export async function GET() {
    const host = 'db.nwphbpiftvhwvsnurqun.supabase.co'
    const results: any = {
        host,
        timestamp: new Date().toISOString(),
    }

    try {
        results.ipv4 = await resolve4(host)
    } catch (error: any) {
        results.ipv4_error = error.message
    }

    try {
        const lookup = await promisify(dns.lookup)(host)
        results.lookup = lookup
    } catch (error: any) {
        results.lookup_error = error.message
    }

    return NextResponse.json(results)
}
