import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const prisma = new PrismaClient();

async function verifySubcategoryProducts() {
  console.log('\n=== VERIFYING SUBCATEGORY PRODUCTS ===\n');
  
  // Get all subcategories (categories with parentId)
  const subCategories = await prisma.category.findMany({
    where: {
      parentId: { not: null }
    },
    include: {
      parent: true
    }
  });
  
  console.log(`Found ${subCategories.length} subcategories\n`);
  
  for (const subCat of subCategories) {
    // Count products linked to this subcategory
    const productCount = await prisma.productCategory.count({
      where: {
        categoryId: subCat.id
      }
    });
    
    console.log(`${subCat.parent.name} -> ${subCat.name}: ${productCount} products`);
    
    if (productCount === 0) {
      console.log(`  ⚠️  WARNING: No products found for ${subCat.name}`);
    }
  }
  
  // Test the exact query used in the subcategory page
  console.log('\n=== TESTING PAGE QUERY ===\n');
  const testSubCat = subCategories[0];
  if (testSubCat) {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        productCategories: {
          some: {
            categoryId: testSubCat.id,
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
      },
      take: 5
    });
    
    console.log(`Query for ${testSubCat.name} returned ${products.length} products`);
    if (products.length > 0) {
      console.log('\nSample products:');
      products.forEach(p => console.log(`  - ${p.name} (${p.sku})`));
    }
  }
  
  await prisma.$disconnect();
}

verifySubcategoryProducts().catch(console.error);
