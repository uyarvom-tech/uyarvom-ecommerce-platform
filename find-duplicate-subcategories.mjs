import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const prisma = new PrismaClient();

async function findDuplicates() {
  console.log('\n=== CHECKING FOR DUPLICATE SUBCATEGORIES ===\n');
  
  // Get all subcategories grouped by name and parent
  const subCategories = await prisma.category.findMany({
    where: { parentId: { not: null } },
    include: {
      parent: true,
      productCategories: true
    },
    orderBy: [
      { parentId: 'asc' },
      { name: 'asc' }
    ]
  });
  
  const grouped = {};
  
  for (const sub of subCategories) {
    const key = `${sub.parent?.name}::${sub.name}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push({
      id: sub.id,
      productCount: sub.productCategories.length,
      createdAt: sub.createdAt
    });
  }
  
  console.log('Subcategories with multiple entries:\n');
  
  let duplicateCount = 0;
  for (const [key, entries] of Object.entries(grouped)) {
    if (entries.length > 1) {
      duplicateCount++;
      console.log(`${key}:`);
      entries.forEach(e => {
        console.log(`  - ID: ${e.id}, Products: ${e.productCount}, Created: ${e.createdAt.toISOString()}`);
      });
      console.log();
    }
  }
  
  console.log(`\nTotal duplicate subcategory names: ${duplicateCount}`);
  console.log(`Total subcategories: ${subCategories.length}`);
  
  await prisma.$disconnect();
}

findDuplicates().catch(console.error);
