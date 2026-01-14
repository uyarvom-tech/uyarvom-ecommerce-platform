import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET() {
    const publicDir = path.join(process.cwd(), 'public')
    try {
        const files = fs.readdirSync(publicDir)
        const stats = files.map(file => {
            const filePath = path.join(publicDir, file)
            const stat = fs.statSync(filePath)
            return {
                name: file,
                isDir: stat.isDirectory(),
                size: stat.size
            }
        })

        return NextResponse.json({
            cwd: process.cwd(),
            publicDir,
            files: stats
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message, cwd: process.cwd(), publicDir }, { status: 500 })
    }
}
