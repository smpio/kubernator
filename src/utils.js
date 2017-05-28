export const memoize = (fn) => {
  let cache = new Map()

  return (...args) => {
    let key = JSON.stringify(args)
    let value = cache.get(key)

    if (value === undefined) {
      value = fn(...args)
      cache.set(key, value)
    }

    return value
  }
}
