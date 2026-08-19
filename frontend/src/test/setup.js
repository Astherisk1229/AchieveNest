// Global browser storage polyfill for pure Node unit testing
if (typeof globalThis.localStorage === 'undefined') {
  const storage = new Map()
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, val) => storage.set(key, String(val)),
    removeItem: (key) => storage.delete(key),
    clear: () => storage.clear()
  }
}

if (typeof globalThis.sessionStorage === 'undefined') {
  const storage = new Map()
  globalThis.sessionStorage = {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, val) => storage.set(key, String(val)),
    removeItem: (key) => storage.delete(key),
    clear: () => storage.clear()
  }
}
