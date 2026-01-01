const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addDefaultStoolImage() {
  try {
    console.log('🖼️ Adding default image to plastic stool...')
    
    const productId = 'cmjr0bwj1000r4y6i0ewmnic2'
    
    // Add a default image
    await prisma.productImage.create({
      data: {
        productId: productId,
        imageUrl: 'https://via.placeholder.com/400x400/6b7280/ffffff?text=Multi+Color+Stool',
        altText: 'Plastic Stool - Multi Color',
        isPrimary: true,
        sortOrder: 0
      }
    })
    
    console.log('✅ Default image added!')
    
  } catch (error) {
    console.error('❌ Failed to add image:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addDefaultStoolImage()