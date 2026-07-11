import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "file:./dev.db"
    }
  },
  transactionOptions: {
    maxWait: 10000,  // Max time to wait for a transaction slot (10s)
    timeout: 30000,  // Max time the interactive transaction can run (30s)
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma