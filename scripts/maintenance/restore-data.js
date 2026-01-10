const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

const prisma = new PrismaClient()

async function restoreData() {
  try {
    console.log('🔄 Restoring data from backup...')
    
    // Read backup file
    const backup = JSON.parse(fs.readFileSync('data-backup.json', 'utf8'))
    
    console.log(`📊 Restoring from backup created: ${backup.timestamp}`)
    
    // Restore users first
    for (const user of backup.users) {
      const { adminUser, ...userData } = user
      
      const createdUser = await prisma.user.create({
        data: {
          id: userData.id,
          email: userData.email,
          password: userData.password,
          fullName: userData.fullName,
          avatarUrl: userData.avatarUrl,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt
        }
      })
      
      // Create admin user if exists
      if (adminUser) {
        await prisma.adminUser.create({
          data: {
            id: adminUser.id,
            userId: createdUser.id,
            role: adminUser.role,
            permissions: adminUser.permissions,
            createdAt: adminUser.createdAt,
            updatedAt: adminUser.updatedAt
          }
        })
      }
    }
    
    // Restore categories
    for (const category of backup.categories) {
      await prisma.category.create({
        data: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          imageUrl: category.imageUrl,
          displayOrder: category.displayOrder,
          parentId: category.parentId,
          isActive: true, // New field, default to true
          createdAt: category.createdAt,
          updatedAt: category.updatedAt
        }
      })
    }
    
    // Restore products with new many-to-many structure
    for (const product of backup.products) {
      const { images, category, ...productData } = product
      
      const createdProduct = await prisma.product.create({
        data: {
          id: productData.id,
          name: productData.name,
          slug: productData.slug,
          description: productData.description,
          shortDescription: productData.shortDescription,
          price: productData.price,
          compareAtPrice: productData.compareAtPrice,
          stockQuantity: productData.stockQuantity,
          lowStockThreshold: productData.lowStockThreshold,
          sku: productData.sku,
          weight: productData.weight,
          dimensions: productData.dimensions,
          isActive: productData.isActive,
          isFeatured: productData.isFeatured,
          createdAt: productData.createdAt,
          updatedAt: productData.updatedAt
        }
      })
      
      // Create product-category relationship (using old primary category)
      if (category) {
        await prisma.productCategory.create({
          data: {
            productId: createdProduct.id,
            categoryId: category.id,
            isPrimary: true
          }
        })
      }
      
      // Restore images
      for (const image of images) {
        await prisma.productImage.create({
          data: {
            id: image.id,
            productId: createdProduct.id,
            imageUrl: image.imageUrl,
            altText: image.altText,
            isPrimary: image.isPrimary,
            sortOrder: image.sortOrder,
            createdAt: image.createdAt
          }
        })
      }
    }
    
    console.log('✅ Data restored successfully!')
    console.log(`📊 Restored:`)
    console.log(`   - ${backup.users.length} users`)
    console.log(`   - ${backup.categories.length} categories`)
    console.log(`   - ${backup.products.length} products`)
    
  } catch (error) {
    console.error('❌ Restore failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

restoreData()