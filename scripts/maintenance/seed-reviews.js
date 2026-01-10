const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedReviews() {
  try {
    console.log('🌱 Seeding sample reviews...')

    // Get some products and users
    const products = await prisma.product.findMany({ take: 3 })
    const users = await prisma.user.findMany({ take: 5 })

    if (products.length === 0 || users.length === 0) {
      console.log('❌ No products or users found. Please seed products and users first.')
      return
    }

    const sampleReviews = [
      {
        productId: products[0].id,
        userId: users[0].id,
        rating: 5,
        title: "Absolutely love this product!",
        comment: "The quality exceeded my expectations. Beautiful craftsmanship and arrived quickly. Highly recommend!",
        isVerified: true
      },
      {
        productId: products[0].id,
        userId: users[1].id,
        rating: 4,
        title: "Great value for money",
        comment: "Really happy with this purchase. Good quality and looks exactly like the pictures.",
        isVerified: false
      },
      {
        productId: products[1].id,
        userId: users[0].id,
        rating: 4,
        title: "Good product",
        comment: "Nice quality and fast delivery. Would buy again.",
        isVerified: true
      },
      {
        productId: products[1].id,
        userId: users[1].id,
        rating: 3,
        title: "Decent but could be better",
        comment: "It's okay for the price. Quality is decent but not exceptional.",
        isVerified: false
      }
    ]

    // Create reviews
    for (const reviewData of sampleReviews) {
      try {
        await prisma.review.create({
          data: reviewData
        })
        console.log(`✅ Created review for product ${reviewData.productId}`)
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️ Review already exists for user ${reviewData.userId} and product ${reviewData.productId}`)
        } else {
          console.error('Error creating review:', error)
        }
      }
    }

    console.log('🎉 Sample reviews seeded successfully!')

    // Show review stats
    const reviewCount = await prisma.review.count()
    console.log(`📊 Total reviews in database: ${reviewCount}`)

  } catch (error) {
    console.error('❌ Error seeding reviews:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedReviews()