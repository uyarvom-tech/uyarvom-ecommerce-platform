import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const categories = await prisma.category.findMany({
        where: { parentId: null }
    })

    console.log('--- Top Level Categories (Recursive Count) ---')
    for (const cat of categories) {
        const children = await prisma.category.findMany({
            where: { parentId: cat.id },
            select: { id: true }
        })

        const categoryIds = [cat.id, ...children.map(c => c.id)]

        const count = await prisma.product.count({
            where: {
                productCategories: {
                    some: {
                        categoryId: { in: categoryIds }
                    }
                }
            }
        })

        console.log(`${cat.name} (${cat.slug}): ${count} total products`)
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
