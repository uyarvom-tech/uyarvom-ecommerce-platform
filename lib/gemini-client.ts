/**
 * Gemini AI Image Generation Client
 * Uses gemini-2.5-flash-image to generate actual product images.
 * Reference image (existing product photo) + text prompt → new image base64 → upload to R2 → return URL
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image'
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

export interface GenerateImageParams {
  prompt: string
  referenceImageUrl?: string
  /** e.g. "products", "categories" */
  uploadPrefix?: string
  /** label for the alt text */
  label?: string
}

export interface GenerateImageResult {
  success: boolean
  imageUrl?: string
  error?: string
}

// ─── R2 helper ────────────────────────────────────────────────────────────────

function buildR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}

async function uploadBase64ToR2(
  base64Data: string,
  mimeType: string,
  prefix: string
): Promise<string> {
  const r2 = buildR2Client()
  const ext = mimeType.split('/')[1] || 'png'
  const key = `${prefix}/ai-gen-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`
  const buffer = Buffer.from(base64Data, 'base64')

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  )

  return `${process.env.R2_PUBLIC_URL}/${key}`
}

// ─── Fetch reference image as base64 ─────────────────────────────────────────

async function fetchImageAsBase64(
  url: string
): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const mimeType = contentType.split(';')[0].trim()
    const arrayBuffer = await res.arrayBuffer()
    return { data: Buffer.from(arrayBuffer).toString('base64'), mimeType }
  } catch {
    return null
  }
}

// ─── Core generation ──────────────────────────────────────────────────────────

export async function generateProductImage(
  params: GenerateImageParams
): Promise<GenerateImageResult> {
  if (!GEMINI_API_KEY) {
    return { success: false, error: 'GEMINI_API_KEY is not configured' }
  }

  try {
    const parts: any[] = []

    // Attach reference image if available
    if (params.referenceImageUrl) {
      const ref = await fetchImageAsBase64(params.referenceImageUrl)
      if (ref) {
        parts.push({ inline_data: { mime_type: ref.mimeType, data: ref.data } })
      }
    }

    parts.push({ text: params.prompt })

    const body = {
      contents: [{ role: 'user', parts }],
      generationConfig: {
        responseModalities: ['IMAGE'],
      },
    }

    const url = `${GEMINI_API_BASE}/${GEMINI_IMAGE_MODEL}:generateContent`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[Gemini] API error:', res.status, text)
      return { success: false, error: `Gemini API ${res.status}: ${text.slice(0, 200)}` }
    }

    const data = await res.json()
    const candidate = data.candidates?.[0]

    if (!candidate) {
      return { success: false, error: 'No candidate returned from Gemini' }
    }

    // Find inline image part (skip thought parts)
    const imagePart = candidate.content?.parts?.find(
      (p: any) => !p.thought && p.inline_data?.data
    )

    if (!imagePart) {
      return { success: false, error: 'Gemini returned no image data' }
    }

    const { data: imgBase64, mime_type: mimeType } = imagePart.inline_data

    // Upload to R2
    const isR2Configured =
      process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME

    let imageUrl: string

    if (isR2Configured) {
      imageUrl = await uploadBase64ToR2(imgBase64, mimeType, params.uploadPrefix ?? 'products')
    } else {
      // Dev fallback: save locally
      const { writeFile, mkdir } = await import('fs/promises')
      const { join } = await import('path')
      const ext = mimeType.split('/')[1] || 'png'
      const filename = `ai-gen-${Date.now()}.${ext}`
      const dir = join(process.cwd(), 'public', 'uploads', 'products')
      await mkdir(dir, { recursive: true })
      await writeFile(join(dir, filename), Buffer.from(imgBase64, 'base64'))
      imageUrl = `/uploads/products/${filename}`
    }

    return { success: true, imageUrl }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[Gemini] generateProductImage error:', message)
    return { success: false, error: message }
  }
}

/**
 * Generate multiple images sequentially to avoid rate limits.
 */
export async function generateMultipleProductImages(
  prompts: string[],
  referenceImageUrl?: string,
  uploadPrefix = 'products'
): Promise<GenerateImageResult[]> {
  const results: GenerateImageResult[] = []
  for (const prompt of prompts) {
    const result = await generateProductImage({ prompt, referenceImageUrl, uploadPrefix })
    results.push(result)
    // Small pause between requests
    if (prompts.indexOf(prompt) < prompts.length - 1) {
      await new Promise((r) => setTimeout(r, 1000))
    }
  }
  return results
}
