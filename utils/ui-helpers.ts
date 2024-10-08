export function sanitizeForm<T>(data: Record<string, any>): T {
  const garbage: string[] = ['__init', 'isTrusted', '_vts']
  const sanitized: Record<string, any> = {}

  for (const key in data) {
    if (garbage.includes(key)) continue

    sanitized[key] = typeof data[key] === 'string'
      ? data[key].trim()
      : data[key]
  }

  return sanitized as T
}

export function randomAvatar(): string {
  return `https://api.dicebear.com/7.x/open-peeps/svg?seed=${(Math.random() + 1)
    .toString(36)
    .substring(7)}&size=100`
}
