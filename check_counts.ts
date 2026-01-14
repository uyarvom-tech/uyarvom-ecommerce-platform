import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.count()
    const categories = await prisma.category.count()
    const products = await prisma.product.count()
    const images = await prisma.productImage.count()

    console.log({
        users,
        categories,
        products,
        images
    })
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
