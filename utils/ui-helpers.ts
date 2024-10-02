export function sanitizeForm<T>(data: Record<string, any>): T {
  const garbage: string[] = ['__init', 'isTrusted', '_vts']
  const sanitized: Record<string, any> = {}

  for (const key in data) {
    if (garbage.includes(key)) continue

    sanitized[key] = data[key].trim()
  }

  return sanitized as T
}
