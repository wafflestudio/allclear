import { describe, expect, it } from 'vitest'
import { Inject, Provider, Service } from './index'

describe('Prisma service provider', () => {
  it('calls service methods without waiting for a TypeORM connection', async () => {
    @Service
    class DatabaseService {
      async read() {
        return 'ready'
      }
    }

    const service = Provider.getService(DatabaseService)
    expect(await service.read()).toBe('ready')
    expect(Provider.getService(DatabaseService)).toBe(service)
  })

  it('injects the registered service instance', async () => {
    @Service
    class Dependency {
      async value() {
        return 42
      }
    }

    @Service
    class Consumer {
      @Inject(Dependency)
      private readonly dependency: Dependency

      async run() {
        return this.dependency.value()
      }
    }

    const consumer = Provider.getService(Consumer)
    expect(await consumer.run()).toBe(42)
  })
})
