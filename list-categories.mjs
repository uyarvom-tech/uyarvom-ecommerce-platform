import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const prisma = new PrismaClient();

async function listCategories() {
  const mainCategories = await prisma.category.findMany({
    where: { parentId: null },
    include: {
      children: {
        take: 3
      }
    },
    take: 3
  });
  
  console.log('\n=== SAMPLE CATEGORIES ===\n');
  
  for (const main of mainCategories) {
    console.log(`\n${main.name} (${main.id})`);
    for (const sub of main.children) {
      console.log(`  → ${sub.name} (${sub.id})`);
    }
  }
  
  await prisma.$disconnect();
}

listCategories().catch(console.error);
