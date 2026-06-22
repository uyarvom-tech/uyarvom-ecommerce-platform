import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const prisma = new PrismaClient();

async function cleanupEmptySubcategories() {
  console.log('\n=== CLEANUP EMPTY SUBCATEGORIES ===\n');
  
  // Find all subcategories with 0 products
  const emptySubcategories = await prisma.category.findMany({
    where: {
      parentId: { not: null }
    },
    include: {
      productCategories: true,
      parent: true
    }
  });
  
  const toDelete = emptySubcategories.filter(cat => cat.productCategories.length === 0);
  
  console.log(`Found ${toDelete.length} empty subcategories to delete:\n`);
  
  toDelete.forEach(cat => {
    console.log(`  - ${cat.parent?.name} -> ${cat.name} (${cat.id})`);
  });
  
  console.log(`\nDeleting ${toDelete.length} empty subcategories...`);
  
  for (const cat of toDelete) {
    await prisma.category.delete({
      where: { id: cat.id }
    });
    console.log(`  ✓ Deleted: ${cat.name}`);
  }
  
  console.log(`\n✓ Cleanup complete! Deleted ${toDelete.length} empty subcategories.`);
  
  await prisma.$disconnect();
}

cleanupEmptySubcategories().catch(console.error);
