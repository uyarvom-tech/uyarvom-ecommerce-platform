#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres.qwfyjhynruzprqoqvpvv:Uyarvom2026@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1' } }
})

const R2_BASE = 'https://pub-c87cc954ba2e4a289b4f50beaef0560b.r2.dev'

async function main() {
  const cats = await db.category.findMany({ select: { name: true, slug: true, imageUrl: true } })
  console.log('\n=== ALL CATEGORY imageUrls ===')
  cats.forEach(c => console.log(`  [${c.slug}] ${c.name}: ${c.imageUrl || 'NULL'}`))

  // Check which ones are missing or have wrong paths
  const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3')
  const r2 = new S3Client({
    region: 'auto',
    endpoint: 'https://c08825f6d9d99fd75c640ae57c5e97f2.r2.cloudflarestorage.com',
    credentials: { accessKeyId: '74ade9b2cb751054aefed5c3c892fddd', secretAccessKey: 'd97978d5c7f2300b410f6e2cf811ba19a9fca591615631132d14c906ada697cf' }
  })
  let token; const keys = []
  do {
    const res = await r2.send(new ListObjectsV2Command({ Bucket: 'uyarvom-images-beta', MaxKeys: 1000, ContinuationToken: token }))
    res.Contents?.forEach(o => keys.push(o.Key))
    token = res.NextContinuationToken
  } while (token)

  console.log('\n=== BUCKET uploads/ keys ===')
  keys.filter(k => k.startsWith('uploads/')).forEach(k => console.log(' ', k))

  console.log('\n=== CROSS CHECK ===')
  for (const cat of cats) {
    if (!cat.imageUrl) { console.log(`  ❌ NULL: ${cat.name}`); continue }
    const key = cat.imageUrl.replace(R2_BASE + '/', '')
    const exists = keys.includes(key)
    console.log(`  ${exists ? '✅' : '❌'} ${cat.name}: ${key}`)
  }
}

main().catch(e => console.error('ERROR:', e.message)).finally(() => db.$disconnect())
