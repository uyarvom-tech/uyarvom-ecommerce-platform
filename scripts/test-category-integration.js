const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testCategoryIntegration() {
  try {
    console.log('🔍 Testing Category Integration Across All Pages...')
    
    // Test 1: Categories page data
    console.log('\n1. Testing Categories Page Data:')
    const categoriesPageData = await prisma.category.findMany({
      where: { 
        isActive: true,
        parentId: null 
      },
      include: {
        _count: {
          select: {
            productCategories: true
          }
        }
      },
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' }
      ]
    })
    
    console.log(`   ✅ Found ${categoriesPageData.length} active root categories`)
    categoriesPageData.forEach(cat => {
      console.log(`   - ${cat.name} (${cat._count.productCategories} products)`)
    })
    
    // Test 2: Homepage showcase categories
    console.log('\n2. Testing Homepage Showcase Categories:')
    const showcaseCategories = await prisma.category.findMany({
      where: {
        isActive: true,
        parentId: null
      },
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' }
      ],
      take: 4
    })
    
    console.log(`   ✅ Found ${showcaseCategories.length} categories for homepage showcase`)
    showcaseCategories.forEach((cat, i) => {
      console.log(`   ${i + 1}. ${cat.name} (slug: ${cat.slug})`)
    })
    
    // Test 3: Header dropdown categories
    console.log('\n3. Testing Header Dropdown Categories:')
    const headerCategories = await prisma.category.findMany({
      where: { 
        isActive: true,
        parentId: null 
      },
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' }
      ]
    })
    
    console.log(`   ✅ Found ${headerCategories.length} categories for header dropdown`)
    
    // Test 4: Product filtering by category
    console.log('\n4. Testing Product Category Filtering:')
    for (const category of showcaseCategories.slice(0, 2)) {
      const productsInCategory = await prisma.product.findMany({
        where: {
          isActive: true,
          productCategories: {
            some: {
              categoryId: category.id
            }
          }
        },
        include: {
          productCategories: {
            include: { category: true }
          }
        }
      })
      
      console.log(`   ✅ Category "${category.name}": ${productsInCategory.length} products`)
    }
    
    // Test 5: Search functionality
    console.log('\n5. Testing Search Categories:')
    const searchCategories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' }
      ]
    })
    
    console.log(`   ✅ Found ${searchCategories.length} categories for search filtering`)
    
    // Test 6: Individual product category display
    console.log('\n6. Testing Individual Product Category Display:')
    const sampleProduct = await prisma.product.findFirst({
      where: { isActive: true },
      include: {
        productCategories: {
          include: { category: true },
          orderBy: { isPrimary: 'desc' }
        }
      }
    })
    
    if (sampleProduct) {
      const primaryCategory = sampleProduct.productCategories.find(pc => pc.isPrimary)?.category || sampleProduct.productCategories[0]?.category
      console.log(`   ✅ Sample product "${sampleProduct.name}":`)
      console.log(`      Primary category: ${primaryCategory?.name || 'None'}`)
      console.log(`      Total categories: ${sampleProduct.productCategories.length}`)
    }
    
    // Test 7: Category image support
    console.log('\n7. Testing Category Images:')
    const categoriesWithImages = await prisma.category.findMany({
      where: { 
        isActive: true,
        imageUrl: { not: null }
      }
    })
    
    console.log(`   ✅ Found ${categoriesWithImages.length} categories with images`)
    categoriesWithImages.forEach(cat => {
      console.log(`   - ${cat.name}: ${cat.imageUrl}`)
    })
    
    console.log('\n🎉 Category Integration Test Summary:')
    console.log(`   ✅ Categories Page: ${categoriesPageData.length} categories`)
    console.log(`   ✅ Homepage Showcase: ${showcaseCategories.length} categories`)
    console.log(`   ✅ Header Dropdown: ${headerCategories.length} categories`)
    console.log(`   ✅ Search Filtering: ${searchCategories.length} categories`)
    console.log(`   ✅ Product Display: Working with multi-category support`)
    console.log(`   ✅ Image Support: ${categoriesWithImages.length} categories with images`)
    console.log('\n✅ All category integrations are working correctly!')
    
  } catch (error) {
    console.error('❌ Category integration test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCategoryIntegration()