const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateColorVariantImages() {
  try {
    console.log('🎨 Updating color variant images...')
    
    // Update red variant to use a placeholder
    await prisma.productVariant.updateMany({
      where: {
        productId: 'cmjr0bwj1000r4y6i0ewmnic2',
        value: 'Red'
      },
      data: {
        colorImage: 'https://via.placeholder.com/400x400/dc2626/ffffff?text=Red+Stool'
      }
    })
    
    // Update blue variant to use a placeholder
    await prisma.productVariant.updateMany({
      where: {
        productId: 'cmjr0bwj1000r4y6i0ewmnic2',
        value: 'Blue'
      },
      data: {
        colorImage: 'https://via.placeholder.com/400x400/2563eb/ffffff?text=Blue+Stool'
      }
    })
    
    // Update green variant to use a placeholder
    await prisma.productVariant.updateMany({
      where: {
        productId: 'cmjr0bwj1000r4y6i0ewmnic2',
        value: 'Green'
      },
      data: {
        colorImage: 'https://via.placeholder.com/400x400/16a34a/ffffff?text=Green+Stool'
      }
    })
    
    console.log('✅ Color variant images updated!')
    
  } catch (error) {
    console.error('❌ Failed to update images:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateColorVariantImages()