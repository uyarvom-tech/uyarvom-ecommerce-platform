const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addColorFields() {
  try {
    console.log('🔄 Adding color fields to ProductVariant table...')
    
    // Add colorCode column
    try {
      await prisma.$executeRaw`
        ALTER TABLE "product_variants" ADD COLUMN "colorCode" TEXT
      `
      console.log('✅ Added colorCode column')
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log('ℹ️ colorCode column already exists')
      } else {
        console.log('⚠️ Could not add colorCode column:', error.message)
      }
    }
    
    // Add colorImage column
    try {
      await prisma.$executeRaw`
        ALTER TABLE "product_variants" ADD COLUMN "colorImage" TEXT
      `
      console.log('✅ Added colorImage column')
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log('ℹ️ colorImage column already exists')
      } else {
        console.log('⚠️ Could not add colorImage column:', error.message)
      }
    }
    
    console.log('✅ Color fields added successfully!')
    
  } catch (error) {
    console.error('❌ Error adding color fields:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

addColorFields()