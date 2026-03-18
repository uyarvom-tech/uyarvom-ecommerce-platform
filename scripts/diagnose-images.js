#!/usr/bin/env node
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3')
const { PrismaClient } = require('@prisma/client')

const r2 = new S3Client({
  region: 'auto',
  endpoint: 'https://c08825f6d9d99fd75c640ae57c5e97f2.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '74ade9b2cb751054aefed5c3c892fddd',
    secretAccessKey: 'd97978d5c7f2300b410f6e2cf811ba19a9fca591615631132d14c906ada697cf'
  }
})

const db = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres.qwfyjhynruzprqoqvpvv:Uyarvom2026@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1' } }
})

const R2_BASE = 'https://pub-c87cc954ba2e4a289b4f50beaef0560b.r2.dev'

async function main() {
  // 1. List all keys in beta bucket
  let token
  const bucketKeys = new Set()
  do {
    const res = await r2.send(new ListObjectsV2Command({ Bucket: 'uyarvom-images-beta', MaxKeys: 1000, ContinuationToken: token }))
    res.Contents?.forEach(o => bucketKeys.add(o.Key))
    token = res.NextContinuationToken
  } while (token)

  console.log('\n=== BETA R2 BUCKET ===')
  console.log('Total objects:', bucketKeys.size)
  const allKeys = [...bucketKeys]
  console.log('Sample keys:', allKeys.slice(0, 10))

  // 2. Get DB image URLs
  const productImgs = await db.productImage.findMany({ select: { imageUrl: true } })
  const categories = await db.category.findMany({ where: { imageUrl: { not: null } }, select: { name: true, imageUrl: true } })

  console.log('\n=== DB PRODUCT IMAGES (first 5) ===')
  productImgs.slice(0, 5).forEach(i => console.log(' ', i.imageUrl))

  console.log('\n=== DB CATEGORY IMAGES ===')
  categories.forEach(c => console.log(' ', c.name, '->', c.imageUrl))

  // 3. Cross-check: which DB URLs have no matching file in bucket
  console.log('\n=== MISSING IN BUCKET ===')
  let missing = 0
  for (const img of productImgs) {
    const key = img.imageUrl.replace(R2_BASE + '/', '')
    if (!bucketKeys.has(key)) {
      if (missing < 10) console.log('  MISSING:', key)
      missing++
    }
  }
  console.log(`  Total missing product images: ${missing}/${productImgs.length}`)

  for (const cat of categories) {
    const key = cat.imageUrl.replace(R2_BASE + '/', '')
    if (!bucketKeys.has(key)) {
      console.log('  MISSING category:', cat.name, '->', key)
    }
  }
}

main()
  .catch(e => { console.error('ERROR:', e.message); process.exit(1) })
  .finally(() => db.$disconnect())
