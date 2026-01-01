const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkProductImages() {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: '3PCS-Glass-Storage-Jar-Set' },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    if (!product) {
      console.log('❌ Product not found')
      return
    }

    console.log('📦 Product:', product.name)
    console.log('🖼️  Images count:', product.images.length)
    
    if (product.images.length === 0) {
      console.log('⚠️  No images found for this product')
    } else {
      console.log('Images:')
      product.images.forEach((img, index) => {
        console.log(`  ${index + 1}. ${img.imageUrl} (${img.altText || 'No alt text'}) - Primary: ${img.isPrimary}`)
      })
    }

  } catch (error) {
    console.error('💥 Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkProductImages()