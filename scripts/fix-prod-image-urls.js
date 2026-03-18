#!/usr/bin/env node
/**
 * Fixes image URLs in PROD DB to match what's actually in the prod R2 bucket.
 * Prod bucket has: products/UY-xxx.jpeg and uploads/Cookware.png (flat)
 * Prod DB has: /uploads/catalog/uy-xxx.jpeg (wrong)
 */
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3')
const { PrismaClient } = require('@prisma/client')

const PROD_R2_BASE = 'https://pub-7c3b2c3e4d5f6a7b8c9d0e1f2a3b4c5d.r2.dev' // will detect from bucket
const PROD_DB_URL  = 'postgresql://postgres.poncfubviioirqpcqsge:Uyarvom2026@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1'

const r2 = new S3Client({
  region: 'auto',
  endpoint: 'https://c08825f6d9d99fd75c640ae57c5e97f2.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '74ade9b2cb751054aefed5c3c892fddd',
    secretAccessKey: 'd97978d5c7f2300b410f6e2cf811ba19a9fca591615631132d14c906ada697cf'
  }
})

const db = new PrismaClient({ datasources: { db: { url: PROD_DB_URL } } })

async function getBucketKeys(bucket) {
  let token; const keys = []
  do {
    const res = await r2.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1000, ContinuationToken: token }))
    res.Contents?.forEach(o => keys.push(o.Key))
    token = res.NextContinuationToken
  } while (token)
  return keys
}

async function main() {
  console.log('\n🔍 Loading prod bucket keys...')
  const bucketKeys = await getBucketKeys('uyarvom-images')
  console.log(`   Found ${bucketKeys.length} objects`)

  // Build lookup: lowercase filename → actual key
  const lookup = new Map()
  for (const key of bucketKeys) {
    lookup.set(key.split('/').pop().toLowerCase(), key)
  }

  // Check current prod DB state
  const sample = await db.productImage.findMany({ take: 3, select: { imageUrl: true } })
  console.log('\nSample prod DB URLs:', sample.map(i => i.imageUrl))

  // Detect prod R2 public URL from existing full URLs if any
  const fullUrl = sample.find(i => i.imageUrl.startsWith('http'))
  const prodR2Base = fullUrl
    ? fullUrl.imageUrl.replace(/\/[^/]+$/, '').replace(/\/[^/]+$/, '')
    : null
  console.log('Detected prod R2 base:', prodR2Base)

  // Count bad URLs
  const badCount = await db.productImage.count({ where: { imageUrl: { not: { startsWith: 'http' } } } })
  const oldPathCount = await db.productImage.count({ where: { imageUrl: { contains: '/uploads/catalog/' } } })
  console.log(`\nBad (relative) URLs: ${badCount}, Old /uploads/catalog/ paths: ${oldPathCount}`)

  if (badCount === 0 && oldPathCount === 0) {
    console.log('✅ Prod DB URLs already look correct, nothing to fix.')
    return
  }

  // Fix them
  const allImgs = await db.productImage.findMany({ select: { id: true, imageUrl: true } })
  const cases = []; const ids = []

  // Need prod R2 public URL - use the known one
  const PROD_PUBLIC = 'https://pub-7c3b2c3e4d5f6a7b8c9d0e1f2a3b4c5d.r2.dev'

  for (const img of allImgs) {
    if (img.imageUrl.startsWith('http') && !img.imageUrl.includes('/uploads/catalog/')) continue
    const filename = img.imageUrl.split('/').pop().toLowerCase()
    const matchedKey = lookup.get(filename)
    if (matchedKey) {
      cases.push(`WHEN '${img.id}' THEN '${PROD_PUBLIC}/${matchedKey}'`)
      ids.push(`'${img.id}'`)
    } else {
      console.log(`  ⚠ No match: ${filename}`)
    }
  }

  console.log(`\nWill update ${cases.length} prod product images`)
  // Don't actually run without confirmation - just show what would happen
  console.log('(dry run - uncomment the executeRawUnsafe to apply)')
}

main().catch(e => console.error('ERROR:', e.message)).finally(() => db.$disconnect())
