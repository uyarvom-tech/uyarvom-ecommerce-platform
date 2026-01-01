const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addVariantsTable() {
  try {
    console.log('🔄 Adding ProductVariant table...')
    
    // Add the ProductVariant table using raw SQL
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "product_variants" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "productId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "price" REAL,
        "stock" INTEGER NOT NULL DEFAULT 0,
        "sku" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `
    
    // Add unique constraints
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "product_variants_sku_key" ON "product_variants"("sku")
    `
    
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "product_variants_productId_name_value_key" ON "product_variants"("productId", "name", "value")
    `
    
    // Add productVariantId column to order_items if it doesn't exist
    try {
      await prisma.$executeRaw`
        ALTER TABLE "order_items" ADD COLUMN "productVariantId" TEXT
      `
      console.log('✅ Added productVariantId to order_items')
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log('ℹ️ productVariantId column already exists in order_items')
      } else {
        console.log('⚠️ Could not add productVariantId to order_items:', error.message)
      }
    }
    
    // Add productVariantId column to cart_items if it doesn't exist
    try {
      await prisma.$executeRaw`
        ALTER TABLE "cart_items" ADD COLUMN "productVariantId" TEXT
      `
      console.log('✅ Added productVariantId to cart_items')
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log('ℹ️ productVariantId column already exists in cart_items')
      } else {
        console.log('⚠️ Could not add productVariantId to cart_items:', error.message)
      }
    }
    
    console.log('✅ ProductVariant table and relationships added successfully!')
    
  } catch (error) {
    console.error('❌ Error adding variants table:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

addVariantsTable()