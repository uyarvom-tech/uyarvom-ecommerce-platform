import { PrismaClient } from '@prisma/client'

// Create a build-safe Prisma client that won't fail during static generation
function createPrismaClient() {
  // Check if we have a valid DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL
  
  // During build time or when DATABASE_URL is not properly configured
  if (!databaseUrl || 
      databaseUrl === 'placeholder-database-url' || 
      !databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
    
    // Return a mock client that won't make actual database calls
    return {
      user: {
        findUnique: () => Promise.resolve(null),
        findMany: () => Promise.resolve([]),
        create: () => Promise.resolve(null),
        update: () => Promise.resolve(null),
        delete: () => Promise.resolve(null),
        count: () => Promise.resolve(0),
      },
      category: {
        findUnique: () => Promise.resolve(null),
        findMany: () => Promise.resolve([]),
        create: () => Promise.resolve(null),
        update: () => Promise.resolve(null),
        delete: () => Promise.resolve(null),
        count: () => Promise.resolve(0),
      },
      product: {
        findUnique: () => Promise.resolve(null),
        findMany: () => Promise.resolve([]),
        create: () => Promise.resolve(null),
        update: () => Promise.resolve(null),
        delete: () => Promise.resolve(null),
        count: () => Promise.resolve(0),
      },
      productCategory: {
        findUnique: () => Promise.resolve(null),
        findMany: () => Promise.resolve([]),
        create: () => Promise.resolve(null),
        update: () => Promise.resolve(null),
        delete: () => Promise.resolve(null),
        count: () => Promise.resolve(0),
      },
      order: {
        findUnique: () => Promise.resolve(null),
        findMany: () => Promise.resolve([]),
        create: () => Promise.resolve(null),
        update: () => Promise.resolve(null),
        delete: () => Promise.resolve(null),
        count: () => Promise.resolve(0),
      },
      $disconnect: () => Promise.resolve(),
    } as any
  }
  
  // Return real Prisma client for production
  return new PrismaClient()
}

// Global instance to prevent multiple connections
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma