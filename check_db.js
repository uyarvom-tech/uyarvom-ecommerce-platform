const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });
const prisma = new PrismaClient();

async function main() {
  // Test: find all products linked to "Cast Iron" subcategory
  const castIronCat = await prisma.category.findFirst({
    where: { name: 'Cast Iron' }
  });
  
  if (!castIronCat) {
    console.log('Cast Iron category not found');
    return;
  }
  
  console.log('Cast Iron category:', castIronCat.id, 'parentId:', castIronCat.parentId);
  
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      productCategories: {
        some: { categoryId: castIronCat.id }
      }
    },
    select: { name: true, sku: true }
  });
  
  console.log(`\nProducts in "Cast Iron" subcategory (${products.length}):`);
  products.forEach(p => console.log(`  - ${p.name} (${p.sku})`));
  
  // Also check the parent COOKWARE
  const cookwareCat = await prisma.category.findFirst({
    where: { name: 'COOKWARE', parentId: null }
  });
  
  if (cookwareCat) {
    const allSubcatIds = await prisma.category.findMany({
      where: { parentId: cookwareCat.id },
      select: { id: true, name: true }
    });
    
    console.log('\n\nAll COOKWARE sub-categories and their product counts:');
    for (const sub of allSubcatIds) {
      const count = await prisma.productCategory.count({
        where: { categoryId: sub.id }
      });
      console.log(`  - ${sub.name}: ${count} products`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
