import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const prisma = new PrismaClient();

async function checkProducts() {
  console.log('\n=== CHECKING PRODUCT CATEGORIES ===\n');
  
  const productCategories = await prisma.productCategory.findMany({
    include: {
      category: true,
      product: true
    }
  });
  
  console.log(`Total ProductCategory entries: ${productCategories.length}\n`);
  
  const subCategories = await prisma.category.findMany({
    where: {
      parentId: { not: null }
    }
  });
  
  console.log(`Total SubCategories: ${subCategories.length}\n`);
  
  for (const sub of subCategories) {
    const count = productCategories.filter(pc => pc.categoryId === sub.id).length;
    console.log(`${sub.name} (${sub.id}): ${count} products`);
  }
  
  console.log('\n=== SAMPLE PRODUCT CATEGORY MAPPINGS ===\n');
  console.log(JSON.stringify(productCategories.slice(0, 10), null, 2));
  
  await prisma.$disconnect();
}

checkProducts().catch(console.error);
