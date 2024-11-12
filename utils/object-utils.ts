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
