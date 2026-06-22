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
    const uploadType = formData.get('type') as string || 'products'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Check if Cloudflare R2 is configured
    const isR2Configured = process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME;

    if (isR2Configured) {
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')

      const r2 = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
      })

      const extension = file.name.split('.').pop()
      const key = `${uploadType}/${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${extension}`

      await r2.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      }))

      const url = `${process.env.R2_PUBLIC_URL}/${key}`
      console.log('✅ File uploaded to R2:', url)

      return NextResponse.json({
        url,
        filename: key,
        size: file.size,
        type: file.type,
        message: 'File uploaded successfully to R2'
      })
    }

    // Fallback to local storage ONLY in development
    if (process.env.NODE_ENV === 'development') {
      const validTypes = ['products', 'category', 'categories']
      const folderName = validTypes.includes(uploadType) ? (uploadType === 'category' ? 'categories' : uploadType) : 'products'

      const uploadsDir = join(process.cwd(), 'public', 'uploads', folderName)
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true })
      }

      const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${file.name.split('.').pop()}`
      const filepath = join(uploadsDir, filename)

      await writeFile(filepath, buffer)
      const url = `/uploads/${folderName}/${filename}`

      return NextResponse.json({
        url,
        filename,
        message: 'File uploaded successfully (local)'
      })
    }

    return NextResponse.json({
      error: 'R2 storage is not configured. Please set R2 environment variables.'
    }, { status: 500 })

  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    )
  }
}
