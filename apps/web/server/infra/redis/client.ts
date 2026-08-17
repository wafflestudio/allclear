import { createClient } from 'redis'
import { ENV } from 'server/ENV'

type RedisClient = ReturnType<typeof createClient>

let client: RedisClient | null = null
let connectPromise: Promise<RedisClient | null> | null = null

export async function getRedisClient(): Promise<RedisClient | null> {
  if (!ENV.REDIS.URL) {
    return null
  }

  if (!client) {
    client = createClient({
      url: ENV.REDIS.URL,
    })
    client.on('error', (err) => {
      console.error('redis error: ', err)
    })
  }

  if (client.isOpen) {
    return client
  }

  if (!connectPromise) {
    connectPromise = client
      .connect()
      .then(() => {
        connectPromise = null
        return client
      })
      .catch((err) => {
        console.error('redis connect error: ', err)
        connectPromise = null
        return null
      })
  }

  return connectPromise
}

export async function getRequiredRedisClient(): Promise<RedisClient> {
  const redis = await getRedisClient()
  if (!redis) {
    throw new Error('redis is not configured')
  }
  return redis
}
