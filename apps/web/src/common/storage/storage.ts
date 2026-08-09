import type { StorageKey } from './storage-key'

class LocalStorage {
  static set(key: StorageKey, item: string) {
    if (LocalStorage.isBrowser()) {
      localStorage.setItem(key, item)
    }
  }

  static setWithExpiry(key: StorageKey, value: string, expiryTimeInMilliSeconds: number) {
    if (LocalStorage.isBrowser()) {
      const item = {
        value,
        expiry: new Date().getTime() + expiryTimeInMilliSeconds,
      }
      localStorage.setItem(key, JSON.stringify(item))
    }
  }

  static get(key: StorageKey) {
    if (LocalStorage.isBrowser()) {
      return localStorage.getItem(key)
    }
    return null
  }

  static getWithExpiry(key: StorageKey) {
    try {
      if (LocalStorage.isBrowser()) {
        const itemString = localStorage.getItem(key)
        if (!itemString) {
          return null
        }
        const item = JSON.parse(itemString)
        const now = new Date()
        if (now.getTime() > item.expiry) {
          localStorage.removeItem(key)
          return null
        }
        return item.value
      }
    } catch (e) {
      localStorage.removeItem(key)
      return null
    }
  }

  static remove(key: StorageKey) {
    if (LocalStorage.isBrowser()) {
      localStorage.removeItem(key)
    }
  }

  private static isBrowser() {
    return typeof window !== 'undefined'
  }
}

export default LocalStorage
