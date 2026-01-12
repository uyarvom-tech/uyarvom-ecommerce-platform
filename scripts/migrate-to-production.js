#!/usr/bin/env node

/**
 * Migration script to help move from local SQLite to production PostgreSQL
 * Run this script after setting up Supabase and before deploying to Vercel
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

async function migrateData() {
  console.log('🚀 Starting migration to production...')
  
  // Check if we have local data to migrate
  const localDbPath = path.join(__dirname, '../dev.db')
  if (!fs.existsSync(localDbPath)) {
    console.log('❌ No local database found. Nothing to migrate.')
    return
  }

  // Initialize Prisma clients
  const localPrisma = new PrismaClient({
    datasources: {
      db: {
        url: 'file:./dev.db'
      }
    }
  })

  const prodPrisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })

  try {
    console.log('📊 Fetching local data...')
    
    // Get local data
    const [categories, products, productCategories, productImages] = await Promise.all([
      localPrisma.category.findMany(),
      localPrisma.product.findMany(),
      localPrisma.productCategory.findMany(),
      localPrisma.productImage.findMany()
    ])

    console.log(`Found:`)
    console.log(`  - ${categories.length} categories`)
    console.log(`  - ${products.length} products`)
    console.log(`  - ${productCategories.length} product-category relations`)
    console.log(`  - ${productImages.length} product images`)

    // Migrate categories first
    console.log('📁 Migrating categories...')
    for (const category of categories) {
      await prodPrisma.category.upsert({
        where: { id: category.id },
        update: category,
        create: category
      })
    }

    // Migrate products
    console.log('📦 Migrating products...')
    for (const product of products) {
      await prodPrisma.product.upsert({
        where: { id: product.id },
        update: product,
        create: product
      })
    }

    // Migrate product categories
    console.log('🔗 Migrating product-category relations...')
    for (const pc of productCategories) {
      await prodPrisma.productCategory.upsert({
        where: { id: pc.id },
        update: pc,
        create: pc
      })
    }

    // Migrate product images
    console.log('🖼️ Migrating product images...')
    for (const image of productImages) {
      await prodPrisma.productImage.upsert({
        where: { id: image.id },
        update: image,
        create: image
      })
    }

    console.log('✅ Migration completed successfully!')
    console.log('')
    console.log('⚠️  IMPORTANT: Update image URLs to point to your R2 bucket')
    console.log('⚠️  IMPORTANT: Create your admin user in Supabase')
    console.log('')
    console.log('Next steps:')
    console.log('1. Upload images to Cloudflare R2')
    console.log('2. Update image URLs in the database')
    console.log('3. Create admin user in Supabase')
    console.log('4. Deploy to Vercel')

  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await localPrisma.$disconnect()
    await prodPrisma.$disconnect()
  }
}

// Run migration
migrateData().catch(console.error)