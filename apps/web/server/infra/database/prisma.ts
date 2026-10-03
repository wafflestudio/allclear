import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client'
import { getPrismaDatabaseUrl } from './prisma-url'

const globalForPrisma = globalThis as typeof globalThis & { allclearPrisma?: PrismaClient }

/** Construct once per server process; Prisma opens a connection on its first query. */
export function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.allclearPrisma) {
    globalForPrisma.allclearPrisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: getPrismaDatabaseUrl() }),
    })
  }
  return globalForPrisma.allclearPrisma
}
