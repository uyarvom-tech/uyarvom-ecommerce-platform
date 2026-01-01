const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

const prisma = new PrismaClient()

async function restoreData() {
  try {
    console.log('🔄 Restoring data from backup...')
    
    // Read backup file
    const backup = JSON.parse(fs.readFileSync('data-backup.json', 'utf8'))
    
    console.log('📊 Backup contains:')
    console.log(`   - ${backup.users?.length || 0} users`)
    console.log(`   - ${backup.categories?.length || 0} categories`) 
    console.log(`   - ${backup.products?.length || 0} products`)
    console.log(`   - ${backup.orders?.length || 0} orders`)
    
    // Skip users and categories as they already exist
    console.log('⏭️ Skipping users and categories (already exist)')
    
    // Restore products with new schema
    if (backup.products && backup.products.length > 0) {
      for (const product of backup.products) {
        const { images, categoryId, productCategories, ...productData } = product
        
        const createdProduct = await prisma.product.create({
          data: productData
        })
        
        // Create product category relationship
        if (categoryId) {
          await prisma.productCategory.create({
            data: {
              productId: createdProduct.id,
              categoryId: categoryId,
              isPrimary: true
            }
          })
        }
        
        // Create images
        if (images && images.length > 0) {
          for (const image of images) {
            const { id, ...imageData } = image
            await prisma.productImage.create({
              data: {
                ...imageData,
                productId: createdProduct.id
              }
            })
          }
        }
        
        console.log(`✅ Product restored: ${createdProduct.name}`)
      }
      console.log('✅ Products restored')
    }
    
    console.log('🎉 Data restoration completed!')
    
  } catch (error) {
    console.error('❌ Restoration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

restoreData()