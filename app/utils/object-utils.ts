type NullToUndefined<T> = { [K in keyof T]: null extends T[K] ? Exclude<T[K], null> | undefined : T[K] }

export function nullsToUndefined<T extends Record<string, unknown>>(obj: T): NullToUndefined<T> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === null ? undefined : v]),
  ) as NullToUndefined<T>
}

export function removeEmptyKeys<T>(object: Record<string, any>, deep: boolean = false): T {
  const result: Record<string, any> = {}

  for (const [key, value] of Object.entries(object)) {
    if (value !== undefined && value !== null) {
      if (!deep) result[key] = value

      result[key] = deep && typeof value === 'object' && !Array.isArray(value)
        ? removeEmptyKeys(value)
        : value
    }
  }

  return result as T
}

export function getValueFromNestedKeys<T extends Record<string, any>>(v: T, keys: string): any {
  let value = v

  for (const key of keys.split('.')) {
    if (!value) {
      return value
    }

    value = value[key]
  }

  return value
}

export function flattenObject<T>(obj: Record<string, any>): T {
  const result: Record<string, any> = {}

  function recurse(currentObj: Record<string, any>): void {
    for (const key in currentObj) {
      if (Object.prototype.hasOwnProperty.call(currentObj, key)) {
        const value = currentObj[key]

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          recurse(value)
        }
        else {
          result[key] = value
        }
      }
    }
  }

  recurse(obj)

  return result as T
}
