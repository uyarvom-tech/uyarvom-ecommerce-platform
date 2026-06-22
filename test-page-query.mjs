import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const prisma = new PrismaClient();

// Test with COOKWARE -> Cast Iron
const categoryId = "cmm0xaiui0000eqv81vvv0tcp"; // COOKWARE
const subCategoryId = "cmm0xaj2l0002eqv8c85p1n58"; // Cast Iron

async function testPageQuery() {
  console.log('\n=== TESTING PAGE QUERY ===\n');
  console.log(`Category ID: ${categoryId}`);
  console.log(`SubCategory ID: ${subCategoryId}\n`);
  
  const mainCategory = await prisma.category.findUnique({
    where: {
      id: categoryId,
      parentId: null
    }
  });
  
  console.log(`Main Category: ${mainCategory?.name}`);
  
  const subCategory = await prisma.category.findUnique({
    where: {
      id: subCategoryId,
      parentId: categoryId
    }
  });
  
  console.log(`Sub Category: ${subCategory?.name}\n`);
  
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      productCategories: {
        some: {
          categoryId: subCategoryId,
        },
      },
    },
    include: {
      productCategories: {
        include: {
          category: true,
        },
        orderBy: { isPrimary: 'desc' },
      },
      images: {
        where: { isPrimary: true },
        take: 1,
      },
      colors: {
        select: {
          id: true,
          variants: {
            select: {
              id: true,
              stock: true,
              isActive: true,
              sortOrder: true,
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  console.log(`Found ${products.length} products\n`);
  
  if (products.length > 0) {
    console.log('Sample products:');
    products.forEach(p => {
      console.log(`  - ${p.name} (${p.sku})`);
      console.log(`    Categories: ${p.productCategories.map(pc => pc.category.name).join(', ')}`);
      console.log(`    Has image: ${p.images.length > 0 ? 'Yes' : 'No'}`);
      console.log(`    Colors: ${p.colors.length}`);
      console.log(`    Active: ${p.isActive}`);
    });
  } else {
    console.log('❌ NO PRODUCTS FOUND');
    
    // Check if products exist without the subcategory filter
    const allActiveProducts = await prisma.product.findMany({
      where: { isActive: true },
      take: 5
    });
    console.log(`\nTotal active products in database: ${allActiveProducts.length}`);
    
    // Check ProductCategory entries for this subcategory
    const catLinks = await prisma.productCategory.findMany({
      where: { categoryId: subCategoryId },
      include: { product: true, category: true }
    });
    console.log(`\nProductCategory links for ${subCategory?.name}: ${catLinks.length}`);
    if (catLinks.length > 0) {
      console.log('Sample links:');
      catLinks.slice(0, 3).forEach(link => {
        console.log(`  - ${link.product.name} → ${link.category.name} (Primary: ${link.isPrimary})`);
      });
    }
  }
  
  await prisma.$disconnect();
}

testPageQuery().catch(console.error);
