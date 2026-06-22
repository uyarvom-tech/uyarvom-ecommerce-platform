#!/usr/bin/env node
// Find what R2 keys match the iconMap filenames
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3')
const r2 = new S3Client({
  region: 'auto',
  endpoint: 'https://c08825f6d9d99fd75c640ae57c5e97f2.r2.cloudflarestorage.com',
  credentials: { accessKeyId: '74ade9b2cb751054aefed5c3c892fddd', secretAccessKey: 'd97978d5c7f2300b410f6e2cf811ba19a9fca591615631132d14c906ada697cf' }
})

const iconMapOld = {
  sale:         'uy-gf-sw-mrb-lux-set.jpeg',
  'new-in':     'uy-hd-irn-cnd-std.jpeg',
  cookware:     'uy-kw-ci-skl-12-ps.jpeg',
  serveware:    'uy-gf-sw-cer-set-03.jpeg',
  diningware:   'uy-dw-bcn-des-plt-prm.jpeg',
  'dining-sets':'uy-dw-ss-thl-06-set.jpeg',
  storage:      'uy-gf-st-oil-spc-set.jpeg',
  gifting:      'uy-gf-sw-cop-hmr.jpeg',
}

async function main() {
  let token; const keys = []
  do {
    const res = await r2.send(new ListObjectsV2Command({ Bucket: 'uyarvom-images-beta', MaxKeys: 1000, ContinuationToken: token }))
    res.Contents?.forEach(o => keys.push(o.Key))
    token = res.NextContinuationToken
  } while (token)

  const lookup = new Map(keys.map(k => [k.split('/').pop().toLowerCase(), k]))

  const R2 = 'https://pub-c87cc954ba2e4a289b4f50beaef0560b.r2.dev'
  console.log('\n=== iconMap → R2 URL ===')
  for (const [slug, filename] of Object.entries(iconMapOld)) {
    const key = lookup.get(filename.toLowerCase())
    console.log(`  ${slug}: ${key ? R2 + '/' + key : 'NOT FOUND - ' + filename}`)
  }

  // Also show all products/ keys so we can pick good ones for missing
  console.log('\n=== All products/ keys ===')
  keys.filter(k => k.startsWith('products/')).forEach(k => console.log(' ', k))
}

main().catch(e => console.error(e.message))
