export function removeEmptyKeys<T>(object: Record<string, any>): T {
  const result: Record<string, any> = {}

  for (const [key, value] of Object.entries(object)) {
    if (value !== undefined && value !== null) result[key] = value
  }

  return result as T
}
