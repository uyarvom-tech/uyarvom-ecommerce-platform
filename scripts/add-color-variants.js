const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addColorVariants() {
  try {
    console.log('🎨 Adding color variants to products...')

    // Get the first product
    const product = await prisma.product.findFirst({
      where: { isActive: true }
    })

    if (!product) {
      console.log('❌ No active products found')
      return
    }

    console.log(`📦 Adding color variants to: ${product.name}`)

    // Sample color variants with color codes
    const colorVariants = [
      {
        name: 'Color',
        value: 'Ocean Blue',
        colorCode: '#1e40af',
        stock: 15,
        price: null // Use product base price
      },
      {
        name: 'Color',
        value: 'Forest Green',
        colorCode: '#16a34a',
        stock: 12,
        price: product.price + 50 // Slightly higher price
      },
      {
        name: 'Color',
        value: 'Sunset Orange',
        colorCode: '#ea580c',
        stock: 8,
        price: null
      },
      {
        name: 'Color',
        value: 'Pure White',
        colorCode: '#ffffff',
        stock: 20,
        price: null
      },
      {
        name: 'Color',
        value: 'Charcoal Black',
        colorCode: '#1f2937',
        stock: 10,
        price: product.price + 25
      }
    ]

    // Add each color variant
    for (let i = 0; i < colorVariants.length; i++) {
      const variant = colorVariants[i]
      
      try {
        const created = await prisma.productVariant.create({
          data: {
            productId: product.id,
            name: variant.name,
            value: variant.value,
            colorCode: variant.colorCode,
            stock: variant.stock,
            price: variant.price,
            sortOrder: i,
            isActive: true
          }
        })
        
        console.log(`✅ Added color variant: ${variant.value} (${variant.colorCode})`)
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️  Color variant ${variant.value} already exists, skipping...`)
        } else {
          console.error(`❌ Error adding ${variant.value}:`, error.message)
        }
      }
    }

    console.log('🎉 Color variants added successfully!')
    
    // Show the product with its variants
    const productWithVariants = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        variants: {
          where: { name: 'Color' },
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    console.log('\n📋 Product with color variants:')
    console.log(`Product: ${productWithVariants.name}`)
    console.log('Color Variants:')
    productWithVariants.variants.forEach(variant => {
      console.log(`  - ${variant.value} (${variant.colorCode}) - Stock: ${variant.stock} - Price: ₹${variant.price || productWithVariants.price}`)
    })

  } catch (error) {
    console.error('💥 Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addColorVariants()