type Constructor<T extends object> = new (...args: any[]) => T

export class Provider {
  private static services: Map<string, object> = new Map()

  static registerService<T extends object>(constructor: Constructor<T>, instance?: T) {
    if (!Provider.services.has(constructor.name)) {
      Provider.services.set(constructor.name, instance ?? new constructor())
    }
  }

  static getService<T extends object>(constructor: Constructor<T>): T {
    if (!Provider.services.has(constructor.name)) {
      Provider.registerService(constructor)
    }
    return Provider.services.get(constructor.name) as T
  }
}

export function Service(constructor: Constructor<object>) {
  Provider.registerService(constructor)
}

export function Inject<T extends object>(service: Constructor<T>): PropertyDecorator {
  return (target, fieldName) => {
    Object.defineProperty(target, fieldName, {
      writable: false,
      value: Provider.getService(service),
    })
  }
}
