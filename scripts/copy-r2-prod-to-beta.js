#!/usr/bin/env node
/**
 * Copies all objects from uyarvom-images (prod) → uyarvom-images-beta
 * Same account, same credentials, server-side copy — no downloading.
 */

const { S3Client, ListObjectsV2Command, CopyObjectCommand } = require('@aws-sdk/client-s3')

const ACCOUNT_ID    = 'c08825f6d9d99fd75c640ae57c5e97f2'
const ACCESS_KEY    = '74ade9b2cb751054aefed5c3c892fddd'
const SECRET_KEY    = 'd97978d5c7f2300b410f6e2cf811ba19a9fca591615631132d14c906ada697cf'
const SRC_BUCKET    = 'uyarvom-images'
const DST_BUCKET    = 'uyarvom-images-beta'

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
})

async function main() {
  console.log(`\n📦  Copying ${SRC_BUCKET} → ${DST_BUCKET}\n`)

  let total = 0, ok = 0
  let continuationToken = undefined

  do {
    const list = await r2.send(new ListObjectsV2Command({
      Bucket: SRC_BUCKET,
      ContinuationToken: continuationToken,
    }))

    const keys = (list.Contents || []).map(o => o.Key)
    total += keys.length

    for (const key of keys) {
      try {
        await r2.send(new CopyObjectCommand({
          Bucket: DST_BUCKET,
          CopySource: `${SRC_BUCKET}/${key}`,
          Key: key,
        }))
        ok++
        process.stdout.write(`\r  ✅ ${ok}/${total}  ${key.slice(0, 60)}`)
      } catch (e) {
        console.warn(`\n  ⚠  ${key}: ${e.message}`)
      }
    }

    continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined
  } while (continuationToken)

  console.log(`\n\n✅  Done — copied ${ok}/${total} objects\n`)
}

main().catch(e => { console.error('❌', e.message); process.exit(1) })
