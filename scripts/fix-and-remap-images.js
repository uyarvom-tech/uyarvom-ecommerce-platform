#!/usr/bin/env node
/**
 * Fixes image URLs in beta DB to match what's actually in the beta R2 bucket.
 * Uses raw SQL bulk UPDATE for speed instead of individual Prisma updates.
 */

const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3')
const { PrismaClient } = require('@prisma/client')

const R2_BASE = 'https://pub-c87cc954ba2e4a289b4f50beaef0560b.r2.dev'
const DB_URL  = 'postgresql://postgres.qwfyjhynruzprqoqvpvv:Uyarvom2026@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1'

const r2 = new S3Client({
  region: 'auto',
  endpoint: 'https://c08825f6d9d99fd75c640ae57c5e97f2.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '74ade9b2cb751054aefed5c3c892fddd',
    secretAccessKey: 'd97978d5c7f2300b410f6e2cf811ba19a9fca591615631132d14c906ada697cf'
  }
})

const db = new PrismaClient({ datasources: { db: { url: DB_URL } } })

async function getBucketKeys() {
  let token
  const keys = []
  do {
    const res = await r2.send(new ListObjectsV2Command({ Bucket: 'uyarvom-images-beta', MaxKeys: 1000, ContinuationToken: token }))
    res.Contents?.forEach(o => keys.push(o.Key))
    token = res.NextContinuationToken
  } while (token)
  return keys
}

async function main() {
  console.log('\n🔍 Loading bucket keys...')
  const bucketKeys = await getBucketKeys()
  console.log(`   Found ${bucketKeys.length} objects in beta bucket`)

  // Build lookup: lowercase filename → actual bucket key
  const filenameLookup = new Map()
  for (const key of bucketKeys) {
    const filename = key.split('/').pop().toLowerCase()
    filenameLookup.set(filename, key)
  }

  // ── Fix product images via bulk SQL ─────────────────────────────────────
  console.log('\n🔧 Fixing product image URLs...')
  const productImgs = await db.productImage.findMany({ select: { id: true, imageUrl: true } })

  // Build CASE WHEN ... END bulk update
  const cases = []
  let updated = 0, skipped = 0, notFound = 0

  for (const img of productImgs) {
    const currentKey = img.imageUrl.replace(R2_BASE + '/', '')
    if (bucketKeys.includes(currentKey)) { skipped++; continue }

    const filename = img.imageUrl.split('/').pop().toLowerCase()
    const matchedKey = filenameLookup.get(filename)
    if (matchedKey) {
      const newUrl = `${R2_BASE}/${matchedKey}`
      cases.push(`WHEN '${img.id}' THEN '${newUrl}'`)
      updated++
    } else {
      if (notFound < 5) console.log(`   ⚠ No bucket match for: ${filename}`)
      notFound++
    }
  }

  if (cases.length > 0) {
    const ids = productImgs
      .filter(img => {
        const currentKey = img.imageUrl.replace(R2_BASE + '/', '')
        return !bucketKeys.includes(currentKey) && filenameLookup.has(img.imageUrl.split('/').pop().toLowerCase())
      })
      .map(img => `'${img.id}'`)
      .join(',')

    await db.$executeRawUnsafe(`
      UPDATE "ProductImage"
      SET "imageUrl" = CASE id ${cases.join(' ')} END
      WHERE id IN (${ids})
    `)
  }
  console.log(`   ✅ Updated: ${updated}, Already correct: ${skipped}, Not found: ${notFound}`)

  // ── Fix category images via bulk SQL ────────────────────────────────────
  console.log('\n🔧 Fixing category image URLs...')
  const cats = await db.category.findMany({ where: { imageUrl: { not: null } }, select: { id: true, name: true, imageUrl: true } })
  const catCases = []
  let catUpdated = 0, catSkipped = 0, catNotFound = 0

  for (const cat of cats) {
    const currentKey = cat.imageUrl.replace(R2_BASE + '/', '')
    if (bucketKeys.includes(currentKey)) { catSkipped++; continue }

    const filename = cat.imageUrl.split('/').pop().toLowerCase()
    const matchedKey = filenameLookup.get(filename)
    if (matchedKey) {
      const newUrl = `${R2_BASE}/${matchedKey}`
      catCases.push(`WHEN '${cat.id}' THEN '${newUrl}'`)
      console.log(`   ${cat.name}: → ${matchedKey}`)
      catUpdated++
    } else {
      console.log(`   ⚠ No match for category ${cat.name}: ${filename}`)
      catNotFound++
    }
  }

  if (catCases.length > 0) {
    const catIds = cats
      .filter(c => {
        const currentKey = c.imageUrl.replace(R2_BASE + '/', '')
        return !bucketKeys.includes(currentKey) && filenameLookup.has(c.imageUrl.split('/').pop().toLowerCase())
      })
      .map(c => `'${c.id}'`)
      .join(',')

    await db.$executeRawUnsafe(`
      UPDATE "Category"
      SET "imageUrl" = CASE id ${catCases.join(' ')} END
      WHERE id IN (${catIds})
    `)
  }
  console.log(`   ✅ Updated: ${catUpdated}, Already correct: ${catSkipped}, Not found: ${catNotFound}`)

  // ── Quick verify ────────────────────────────────────────────────────────
  console.log('\n📋 Sample product images after fix:')
  const sample = await db.productImage.findMany({ take: 3, select: { imageUrl: true } })
  sample.forEach(i => console.log('  ', i.imageUrl))

  console.log('\n📋 Category images after fix:')
  const catSample = await db.category.findMany({ where: { imageUrl: { not: null } }, select: { name: true, imageUrl: true } })
  catSample.forEach(c => console.log(`  ${c.name}: ${c.imageUrl}`))

  console.log('\n🎉 Done!\n')
}

main()
  .catch(e => { console.error('❌', e.message); process.exit(1) })
  .finally(() => db.$disconnect())
