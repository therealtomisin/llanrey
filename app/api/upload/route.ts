import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
]

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]

const MAX_VIDEO_SIZE = 500 * 1024 * 1024 // 500MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit: 10 uploads per minute per user
    const { success: withinLimit } = rateLimit(`upload:${user.id}`, {
      limit: 10,
      windowMs: 60_000,
    })

    if (!withinLimit) {
      return NextResponse.json(
        { error: 'Too many uploads. Please wait a moment and try again.' },
        { status: 429 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const fileType = formData.get('type') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!fileType || !['logo', 'profile_picture', 'bitmoji', 'video', 'thumbnail'].includes(fileType)) {
      return NextResponse.json({ error: 'Invalid file type category' }, { status: 400 })
    }

    // Validate MIME type and size based on file type
    const isVideo = fileType === 'video'
    const allowedTypes = isVideo ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file format. Allowed: ${allowedTypes
            .map((t) => t.split('/')[1])
            .join(', ')}`,
        },
        { status: 400 }
      )
    }

    if (file.size > maxSize) {
      const maxMB = Math.round(maxSize / (1024 * 1024))
      return NextResponse.json(
        { error: `File too large. Maximum size: ${maxMB}MB` },
        { status: 400 }
      )
    }

    // Create a unique filename with timestamp
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filename = `${fileType}-${timestamp}-${sanitizedName}`

    const blob = await put(filename, file, {
      access: 'public',
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
