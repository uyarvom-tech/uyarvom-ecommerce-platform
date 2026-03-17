import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { requireStaffAccess } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  // Check admin access
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult // Return error response
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 10MB for category images)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'categories')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const extension = file.name.split('.').pop()
    const filename = `category-${timestamp}-${randomString}.${extension}`
    
    const filepath = join(uploadsDir, filename)
    
    // Write file
    await writeFile(filepath, buffer)
    
    // Return the public URL
    const url = `/uploads/categories/${filename}`
    
    console.log('✅ Category image uploaded:', url)
    
    return NextResponse.json({ 
      url,
      filename,
      size: file.size,
      type: file.type
    })

  } catch (error) {
    console.error('Category image upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload category image' },
      { status: 500 }
    )
  }
}
