/**
 * Push Prisma schema to PRODUCTION database.
 * Run: node scripts/push-to-prod.js
 *
 * This uses the PROD DATABASE_URL directly (not .env.local which points to beta).
 */
const { execSync } = require('child_process')

const PROD_DATABASE_URL = "postgresql://postgres.poncfubviioirqpcqsge:Uyarvom2026@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

console.log('🚀 Pushing Prisma schema to PRODUCTION database...')
console.log('   Target: aws-1-ap-southeast-1.pooler.supabase.com (PROD)')
console.log('')

try {
  execSync(`npx prisma db push --skip-generate`, {
    stdio: 'inherit',
    cwd: require('path').join(__dirname, '..'),
    env: {
      ...process.env,
      DATABASE_URL: PROD_DATABASE_URL,
      DIRECT_URL: PROD_DATABASE_URL,
    },
  })

  console.log('')
  console.log('✅ Schema pushed to PRODUCTION successfully!')
  console.log('')
  console.log('Next steps:')
  console.log('  1. Run product import: node scripts/import-products-to-prod.js')
  console.log('  2. Set up admin user in prod Supabase')
  console.log('  3. Deploy to Vercel with prod env vars')
} catch (error) {
  console.error('❌ Failed to push schema to production')
  process.exit(1)
}
