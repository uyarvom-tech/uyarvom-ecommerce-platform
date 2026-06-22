import { NextRequest, NextResponse } from 'next/server'
import { generatePresignedUrl, generateImageKey } from '@/lib/r2'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated AND has staff/admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only staff/admin can generate upload URLs
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!adminUser || !['admin', 'staff', 'super_admin'].includes(adminUser.role)) {
      return NextResponse.json({ error: 'Staff access required' }, { status: 403 })
    }

    const { filename, contentType, prefix = 'uploads' } = await request.json()

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: 'Filename and content type are required' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Generate unique key for the file
    const key = generateImageKey(prefix, filename)

    // Generate presigned URL
    const { uploadUrl, publicUrl } = await generatePresignedUrl(key, contentType)

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      key
    })
  } catch (error) {
    console.error('Upload URL generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated and is admin/staff
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin/staff
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!adminUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { key } = await request.json()

    if (!key) {
      return NextResponse.json(
        { error: 'File key is required' },
        { status: 400 }
      )
    }

    // Delete file from R2
    const { deleteFile } = await import('@/lib/r2')
    await deleteFile(key)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('File deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}