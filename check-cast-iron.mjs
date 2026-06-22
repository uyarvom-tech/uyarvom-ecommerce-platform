import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const prisma = new PrismaClient();

async function checkCastIron() {
  console.log('\n=== CHECKING CAST IRON SUBCATEGORIES ===\n');
  
  const castIronCategories = await prisma.category.findMany({
    where: {
      name: { contains: 'Cast Iron', mode: 'insensitive' },
      parentId: { not: null }
    },
    include: {
      parent: true,
      productCategories: {
        include: {
          product: true
        }
      }
    }
  });
  
  console.log(`Found ${castIronCategories.length} Cast Iron subcategories:\n`);
  
  for (const cat of castIronCategories) {
    console.log(`${cat.name} (${cat.id})`);
    console.log(`  Parent: ${cat.parent?.name}`);
    console.log(`  Slug: ${cat.slug}`);
    console.log(`  Products: ${cat.productCategories.length}`);
    console.log(`  Created: ${cat.createdAt.toISOString()}`);
    
    if (cat.productCategories.length > 0) {
      console.log(`  Sample products:`);
      cat.productCategories.slice(0, 3).forEach(pc => {
        console.log(`    - ${pc.product.name} (${pc.product.sku})`);
      });
    }
    console.log();
  }
  
  await prisma.$disconnect();
}

checkCastIron().catch(console.error);
