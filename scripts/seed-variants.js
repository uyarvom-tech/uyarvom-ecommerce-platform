const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedVariants() {
  try {
    console.log('🌱 Seeding sample product variants...')

    // Get some products to add variants to
    const products = await prisma.product.findMany({ take: 3 })

    if (products.length === 0) {
      console.log('❌ No products found. Please seed products first.')
      return
    }

    const sampleVariants = [
      // Variants for first product (Glass Storage Jar Set)
      {
        productId: products[0].id,
        name: 'Size',
        value: 'Small Set (500ml + 750ml + 1000ml)',
        price: products[0].price - 200, // ₹200 less
        stock: 15,
        sku: `${products[0].sku || 'VAR'}-SM`,
        sortOrder: 1
      },
      {
        productId: products[0].id,
        name: 'Size',
        value: 'Large Set (880ml + 1400ml + 1700ml)',
        price: null, // Use base price
        stock: 8,
        sku: `${products[0].sku || 'VAR'}-LG`,
        sortOrder: 2
      },
      {
        productId: products[0].id,
        name: 'Color',
        value: 'Clear Glass',
        price: null,
        stock: 12,
        sku: `${products[0].sku || 'VAR'}-CLR`,
        sortOrder: 1
      },
      {
        productId: products[0].id,
        name: 'Color',
        value: 'Tinted Blue',
        price: products[0].price + 150, // ₹150 more
        stock: 6,
        sku: `${products[0].sku || 'VAR'}-BLU`,
        sortOrder: 2
      },

      // Variants for second product (Plastic Helmet)
      {
        productId: products[1].id,
        name: 'Size',
        value: 'Small (52-56cm)',
        price: products[1].price - 50,
        stock: 20,
        sku: `${products[1].sku || 'VAR'}-SM`,
        sortOrder: 1
      },
      {
        productId: products[1].id,
        name: 'Size',
        value: 'Medium (56-60cm)',
        price: null,
        stock: 25,
        sku: `${products[1].sku || 'VAR'}-MD`,
        sortOrder: 2
      },
      {
        productId: products[1].id,
        name: 'Size',
        value: 'Large (60-64cm)',
        price: products[1].price + 30,
        stock: 18,
        sku: `${products[1].sku || 'VAR'}-LG`,
        sortOrder: 3
      },
      {
        productId: products[1].id,
        name: 'Color',
        value: 'White',
        price: null,
        stock: 30,
        sku: `${products[1].sku || 'VAR'}-WHT`,
        sortOrder: 1
      },
      {
        productId: products[1].id,
        name: 'Color',
        value: 'Yellow',
        price: null,
        stock: 22,
        sku: `${products[1].sku || 'VAR'}-YEL`,
        sortOrder: 2
      },
      {
        productId: products[1].id,
        name: 'Color',
        value: 'Red',
        price: products[1].price + 25,
        stock: 15,
        sku: `${products[1].sku || 'VAR'}-RED`,
        sortOrder: 3
      }
    ]

    // Create variants
    for (const variantData of sampleVariants) {
      try {
        await prisma.productVariant.create({
          data: variantData
        })
        console.log(`✅ Created variant: ${variantData.name} - ${variantData.value}`)
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️ Variant already exists: ${variantData.name} - ${variantData.value}`)
        } else {
          console.error('Error creating variant:', error)
        }
      }
    }

    console.log('🎉 Sample variants seeded successfully!')

    // Show variant stats
    const variantCount = await prisma.productVariant.count()
    console.log(`📊 Total variants in database: ${variantCount}`)

    // Show products with variants
    const productsWithVariants = await prisma.product.findMany({
      include: {
        variants: {
          select: {
            name: true,
            value: true,
            price: true,
            stock: true
          }
        }
      },
      where: {
        variants: {
          some: {}
        }
      }
    })

    console.log(`\n📦 Products with variants:`)
    productsWithVariants.forEach(product => {
      console.log(`- ${product.name}: ${product.variants.length} variants`)
      product.variants.forEach(variant => {
        const priceInfo = variant.price ? `₹${variant.price}` : 'base price'
        console.log(`  • ${variant.name}: ${variant.value} (${priceInfo}, ${variant.stock} stock)`)
      })
    })

  } catch (error) {
    console.error('❌ Error seeding variants:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedVariants()