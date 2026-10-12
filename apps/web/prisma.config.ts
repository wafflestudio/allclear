import { config as loadDotEnv } from 'dotenv'
import { defineConfig } from 'prisma/config'
import { getPrismaDatabaseUrl } from './server/infra/database/prisma-url'

loadDotEnv({ path: '.env.local' })

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: getPrismaDatabaseUrl() },
})
