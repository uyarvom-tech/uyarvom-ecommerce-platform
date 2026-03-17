const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testConnection() {
    try {
        console.log('Testing connection...')
        const result = await prisma.$queryRaw`SELECT 1 as result`
        console.log('Connection successful:', result)
        process.exit(0)
    } catch (error) {
        console.error('Connection failed:')
        console.error(error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

testConnection()
