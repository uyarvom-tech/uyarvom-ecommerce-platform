const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

const prisma = new PrismaClient()

async function restoreCategories() {
  try {
    console.log('🔄 Restoring product category mappings from backup...')
    
    // Read backup file
    const backup = JSON.parse(fs.readFileSync('../data-backup.json', 'utf8'))
    
    if (backup.products && backup.products.length > 0) {
      for (const product of backup.products) {
        const { categoryId } = product
        
        if (categoryId) {
          // Create product category relationship
          await prisma.productCategory.create({
            data: {
              productId: product.id,
              categoryId: categoryId,
              isPrimary: true
            }
          })
          console.log(`✅ Restored category mapping for: ${product.name}`)
        }
      }
    }
    
    console.log('🎉 Category mappings restored successfully!')
    
  } catch (error) {
    console.error('❌ Failed to restore categories:', error)
  } finally {
    await prisma.$disconnect()
  }
}

restoreCategories()