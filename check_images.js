const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const images = await prisma.productImage.findMany()
    console.log('Current Product Images in DB:')
    images.forEach(img => {
        console.log(`- ${img.imageUrl}`)
    })
}

main().catch(console.error).finally(() => prisma.$disconnect())
