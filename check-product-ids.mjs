import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const prisma = new PrismaClient();

// Product IDs from the logs
const productIds = [
  'cmm0xen6d00qveqv8u2in62hw',
  'cmm0xejsf00qeeqv88erkve3k'
];

async function checkProducts() {
  console.log('\n=== CHECKING PRODUCT IDS FROM WISHLIST LOGS ===\n');
  
  for (const id of productIds) {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true, sku: true }
    });
    
    if (product) {
      console.log(`Product: ${product.name} (${product.sku})`);
    } else {
      console.log(`Product ID ${id}: NOT FOUND`);
    }
  }
  
  await prisma.$disconnect();
}

checkProducts().catch(console.error);
