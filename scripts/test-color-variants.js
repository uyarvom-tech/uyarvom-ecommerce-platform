const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testColorVariants() {
  try {
    console.log('🧪 Testing Color Variant System...')

    // Get the first product
    const product = await prisma.product.findFirst({
      where: { isActive: true },
      include: {
        variants: {
          where: { name: 'Color' },
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    if (!product) {
      console.log('❌ No active products found')
      return
    }

    console.log(`📦 Testing with product: ${product.name}`)
    console.log(`🔗 Product URL: http://localhost:3000/products/${product.slug}`)
    console.log(`⚙️  Admin URL: http://localhost:3000/admin/products/${product.id}/edit`)

    // Check existing color variants
    console.log(`\n🎨 Current color variants: ${product.variants.length}`)
    
    if (product.variants.length === 0) {
      console.log('⚠️  No color variants found. The color variant manager will show empty state.')
    } else {
      console.log('Color variants:')
      product.variants.forEach((variant, index) => {
        console.log(`  ${index + 1}. ${variant.value}`)
        console.log(`     Color Code: ${variant.colorCode || 'Not set'}`)
        console.log(`     Color Image: ${variant.colorImage || 'Not set'}`)
        console.log(`     Stock: ${variant.stock}`)
        console.log(`     Price: ₹${variant.price || product.price}`)
      })
    }

    console.log('\n✅ Test URLs ready:')
    console.log(`   Customer View: http://localhost:3000/products/${product.slug}`)
    console.log(`   Admin Edit: http://localhost:3000/admin/products/${product.id}/edit`)
    console.log('\n📋 What to test:')
    console.log('   1. Visit admin edit page and scroll to "Color Variants" section')
    console.log('   2. Upload an image and click on it to pick colors')
    console.log('   3. Create color variants with picked colors')
    console.log('   4. Visit customer page to see color dots on the right side')
    console.log('   5. Click color dots to see image and price changes')

  } catch (error) {
    console.error('💥 Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testColorVariants()