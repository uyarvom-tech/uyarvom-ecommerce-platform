/**
 * Test script to verify Gemini API key works for image generation.
 * Uses the same model (gemini-2.5-flash-image) and endpoint as the app.
 *
 * Usage:
 *   node scripts/test-gemini-image.mjs
 *
 * On success, saves the generated image to: scripts/test-output.png
 */

import { writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'

// Load .env.local
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '..', '.env.local') })

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image'
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

async function testGenerateImage() {
  console.log('─── Gemini Image Generation Test ───\n')

  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is not set in .env.local')
    process.exit(1)
  }

  console.log(`API Key: ${GEMINI_API_KEY.slice(0, 10)}...${GEMINI_API_KEY.slice(-4)}`)
  console.log(`Model:   ${GEMINI_IMAGE_MODEL}`)
  console.log('')

  const prompt =
    'Generate a beautiful product photo of a handcrafted ceramic bowl with a rustic glaze finish, placed on a wooden table with soft natural lighting. White background, e-commerce style.'

  console.log(`Prompt: "${prompt.slice(0, 80)}..."`)
  console.log('\n⏳ Calling Gemini API...\n')

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ['IMAGE'],
    },
  }

  const url = `${GEMINI_API_BASE}/${GEMINI_IMAGE_MODEL}:generateContent`

  try {
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
      const errorText = await res.text()
      console.error(`❌ API returned ${res.status}:`)
      console.error(errorText)
      console.error('\n🔑 Your API key is likely invalid or expired.')
      console.error('   → Get a new key at: https://aistudio.google.com/apikey')
      process.exit(1)
    }

    const data = await res.json()
    const candidate = data.candidates?.[0]

    if (!candidate) {
      console.error('❌ No candidate returned from Gemini')
      console.error(JSON.stringify(data, null, 2))
      process.exit(1)
    }

    // Find image part (skip thought parts)
    const imagePart = candidate.content?.parts?.find(
      (p) => !p.thought && p.inline_data?.data
    )

    if (!imagePart) {
      console.error('❌ Gemini returned no image data in response')
      console.error('Parts received:', candidate.content?.parts?.map((p) => Object.keys(p)))
      process.exit(1)
    }

    const { data: imgBase64, mime_type: mimeType } = imagePart.inline_data
    const ext = mimeType.split('/')[1] || 'png'
    const outputPath = join(__dirname, `test-output.${ext}`)

    await writeFile(outputPath, Buffer.from(imgBase64, 'base64'))

    console.log(`✅ Success! Image generated and saved.`)
    console.log(`   Format:   ${mimeType}`)
    console.log(`   Size:     ${(imgBase64.length * 0.75 / 1024).toFixed(1)} KB`)
    console.log(`   Saved to: ${outputPath}`)
  } catch (err) {
    if (err.name === 'TimeoutError') {
      console.error('❌ Request timed out after 60 seconds')
    } else {
      console.error('❌ Error:', err.message)
    }
    process.exit(1)
  }
}

testGenerateImage()
