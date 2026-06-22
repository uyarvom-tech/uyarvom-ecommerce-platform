/**
 * Copy all objects from R2 BETA bucket to R2 PROD bucket.
 * Both buckets are under the same Cloudflare account.
 * 
 * Run: node scripts/sync-r2-beta-to-prod.js
 */
const { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3')

// Beta bucket
const BETA_BUCKET = 'uyarvom-images-beta'
const BETA_PUBLIC_URL = 'https://pub-c87cc954ba2e4a289b4f50beaef0560b.r2.dev'

// Prod bucket
const PROD_BUCKET = 'uyarvom-images'
const PROD_PUBLIC_URL = 'https://pub-46ed84286d6e4cf8afc208ed6c378a37.r2.dev'

// Same account credentials for both (same Cloudflare account)
const ACCOUNT_ID = 'c08825f6d9d99fd75c640ae57c5e97f2'
const ACCESS_KEY = '74ade9b2cb751054aefed5c3c892fddd'
const SECRET_KEY = 'd97978d5c7f2300b410f6e2cf811ba19a9fca591615631132d14c906ada697cf'

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
})

async function listAllObjects(bucket) {
  const objects = []
  let continuationToken = undefined

  while (true) {
    const cmd = new ListObjectsV2Command({
      Bucket: bucket,
      ContinuationToken: continuationToken,
      MaxKeys: 1000,
    })
    const response = await s3.send(cmd)
    if (response.Contents) objects.push(...response.Contents)
    if (!response.IsTruncated) break
    continuationToken = response.NextContinuationToken
  }

  return objects
}

async function copyObject(key) {
  // Get from beta
  const getCmd = new GetObjectCommand({ Bucket: BETA_BUCKET, Key: key })
  const getResponse = await s3.send(getCmd)

  // Read body as buffer
  const chunks = []
  for await (const chunk of getResponse.Body) {
    chunks.push(chunk)
  }
  const body = Buffer.concat(chunks)

  // Put to prod
  const putCmd = new PutObjectCommand({
    Bucket: PROD_BUCKET,
    Key: key,
    Body: body,
    ContentType: getResponse.ContentType || 'image/jpeg',
  })
  await s3.send(putCmd)
}

async function main() {
  console.log('🔄 Syncing R2: BETA → PROD')
  console.log(`   From: ${BETA_BUCKET}`)
  console.log(`   To:   ${PROD_BUCKET}`)
  console.log('')

  // List objects in beta
  console.log('📋 Listing beta bucket objects...')
  const betaObjects = await listAllObjects(BETA_BUCKET)
  console.log(`   Found ${betaObjects.length} objects in beta`)

  // List objects already in prod
  console.log('📋 Listing prod bucket objects...')
  const prodObjects = await listAllObjects(PROD_BUCKET)
  const prodKeys = new Set(prodObjects.map(o => o.Key))
  console.log(`   Found ${prodObjects.length} objects already in prod`)

  // Find objects to copy (not already in prod)
  const toCopy = betaObjects.filter(o => !prodKeys.has(o.Key))
  console.log(`\n📦 ${toCopy.length} new objects to copy\n`)

  if (toCopy.length === 0) {
    console.log('✅ Prod bucket is already up to date!')
    return
  }

  // Copy in sequence (to avoid rate limits)
  let copied = 0
  let failed = 0

  for (const obj of toCopy) {
    try {
      await copyObject(obj.Key)
      copied++
      if (copied % 10 === 0) console.log(`   Copied ${copied}/${toCopy.length}...`)
    } catch (err) {
      failed++
      console.log(`   ⚠️ Failed: ${obj.Key} — ${err.message.slice(0, 50)}`)
    }
  }

  console.log(`\n✅ R2 Sync complete!`)
  console.log(`   Copied: ${copied}`)
  console.log(`   Failed: ${failed}`)
  console.log(`   Total in prod: ${prodObjects.length + copied}`)

  // Also update product image URLs in prod DB if they reference beta URL
  if (copied > 0) {
    console.log('\n📝 Note: Product image URLs in the prod DB may still reference the beta R2 URL.')
    console.log(`   Beta URL: ${BETA_PUBLIC_URL}`)
    console.log(`   Prod URL: ${PROD_PUBLIC_URL}`)
    console.log('   Run the URL migration script next if needed.')
  }
}

main().catch(e => { console.error('❌ Failed:', e.message); process.exit(1) })
