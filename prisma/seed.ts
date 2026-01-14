import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@uyarvom.com',
      password: hashedPassword,
      fullName: 'Admin User'
    }
  })

  // Create regular user
  const regularUser = await prisma.user.create({
    data: {
      email: 'user@example.com',
      password: await bcrypt.hash('user123', 10),
      fullName: 'John Doe'
    }
  })

  // Create categories
  const cookware = await prisma.category.create({
    data: {
      name: 'Cookware',
      slug: 'cookware',
      description: 'Premium ceramic pots, pans, and cooking essentials',
      imageUrl: '/Cookware.png',
      displayOrder: 1
    }
  })

  const dinnerware = await prisma.category.create({
    data: {
      name: 'Dinnerware',
      slug: 'dinnerware',
      description: 'Beautiful plates, bowls, and serving pieces',
      imageUrl: '/Dinnerware.png',
      displayOrder: 2
    }
  })

  const bakeware = await prisma.category.create({
    data: {
      name: 'Bakeware',
      slug: 'bakeware',
      description: 'Ceramic baking dishes and accessories',
      imageUrl: '/Bakeware.png',
      displayOrder: 3
    }
  })

  const serveware = await prisma.category.create({
    data: {
      name: 'Serveware',
      slug: 'serveware',
      description: 'Elegant serving bowls and platters',
      imageUrl: '/Serveware.png',
      displayOrder: 4
    }
  })

  // Create products
  const products = [
    {
      name: 'Artisan Ceramic Cooking Pot',
      slug: 'artisan-ceramic-cooking-pot',
      description: 'Handcrafted ceramic cooking pot perfect for slow cooking and braising. Made from premium ceramic materials.',
      shortDescription: 'Premium ceramic cooking pot for slow cooking',
      price: 2499,
      compareAtPrice: 2999,
      stockQuantity: 25,
      categoryId: cookware.id,
      isFeatured: true,
      images: [
        {
          imageUrl: '/Artisan_Ceramic_Cooking_Pot.png',
          altText: 'Artisan Ceramic Cooking Pot',
          isPrimary: true,
          sortOrder: 0
        }
      ]
    },
    {
      name: 'Elegant Dinner Plate Set',
      slug: 'elegant-dinner-plate-set',
      description: 'Set of 6 elegant ceramic dinner plates. Perfect for everyday dining or special occasions.',
      shortDescription: 'Set of 6 ceramic dinner plates',
      price: 1899,
      compareAtPrice: 2299,
      stockQuantity: 40,
      categoryId: dinnerware.id,
      isFeatured: true,
      images: [
        {
          imageUrl: '/Elegant_Dinner_Plate_Set.png',
          altText: 'Elegant Dinner Plate Set',
          isPrimary: true,
          sortOrder: 0
        }
      ]
    },
    {
      name: 'Ceramic Baking Dish',
      slug: 'ceramic-baking-dish',
      description: 'Large ceramic baking dish perfect for casseroles, roasts, and baked goods.',
      shortDescription: 'Large ceramic baking dish',
      price: 1299,
      stockQuantity: 30,
      categoryId: bakeware.id,
      images: [
        {
          imageUrl: '/Baking_Dish.png',
          altText: 'Ceramic Baking Dish',
          isPrimary: true,
          sortOrder: 0
        }
      ]
    },
    {
      name: 'Ceramic Serving Platter',
      slug: 'ceramic-serving-platter',
      description: 'Beautiful ceramic serving platter for entertaining guests and special occasions.',
      shortDescription: 'Elegant ceramic serving platter',
      price: 999,
      stockQuantity: 20,
      categoryId: serveware.id,
      images: [
        {
          imageUrl: '/Ceramic_Platter.png',
          altText: 'Ceramic Serving Platter',
          isPrimary: true,
          sortOrder: 0
        }
      ]
    },
    {
      name: 'Ceramic Bowl Set',
      slug: 'ceramic-bowl-set',
      description: 'Set of 4 ceramic bowls in different sizes. Perfect for serving soups, salads, and snacks.',
      shortDescription: 'Set of 4 ceramic bowls',
      price: 799,
      stockQuantity: 35,
      categoryId: dinnerware.id,
      images: [
        {
          imageUrl: '/bowls.png',
          altText: 'Ceramic Bowl Set',
          isPrimary: true,
          sortOrder: 0
        }
      ]
    },
    {
      name: 'Ceramic Tea Pot',
      slug: 'ceramic-tea-pot',
      description: 'Traditional ceramic tea pot with elegant design. Perfect for brewing and serving tea.',
      shortDescription: 'Traditional ceramic tea pot',
      price: 1599,
      stockQuantity: 15,
      categoryId: serveware.id,
      images: [
        {
          imageUrl: '/tea_pot.png',
          altText: 'Ceramic Tea Pot',
          isPrimary: true,
          sortOrder: 0
        }
      ]
    }
  ]

  for (const productData of products) {
    const { images, ...product } = productData
    await prisma.product.create({
      data: {
        ...product,
        images: {
          create: images
        }
      }
    })
  }

  console.log('✅ Database seeded successfully!')
  console.log('👤 Admin user: admin@uyarvom.com / admin123')
  console.log('👤 Regular user: user@example.com / user123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })