import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client'
import { getPrismaDatabaseUrl } from './prisma-url'

const globalForPrisma = globalThis as typeof globalThis & { allclearPrisma?: PrismaClient }

// 쉬는 DB 연결은 5분 뒤에 닫습니다. 기본값인 10초로는 요청과 요청 사이에 연결이 닫혀,
// 뜸하게 오는 요청마다 연결을 새로 여느라 늦어집니다.
const IDLE_CONNECTION_TIMEOUT_MS = 5 * 60 * 1000

/** Construct once per server process; Prisma opens a connection on its first query. */
export function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.allclearPrisma) {
    const pool = {
      connectionString: getPrismaDatabaseUrl(),
      idleTimeoutMillis: IDLE_CONNECTION_TIMEOUT_MS,
    }
    globalForPrisma.allclearPrisma = new PrismaClient({ adapter: new PrismaPg(pool) })
  }
  return globalForPrisma.allclearPrisma
}
