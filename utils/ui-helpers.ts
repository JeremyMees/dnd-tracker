export function sanitizeForm<T>(data: Record<string, any>, blacklist?: string[]): T {
  const garbage: string[] = blacklist || ['__init', 'isTrusted', '_vts']
  const sanitized: Record<string, any> = {}

  for (const key in data) {
    if (garbage.includes(key)) continue

    sanitized[key] = typeof data[key] === 'string'
      ? data[key].trim()
      : data[key]
  }

  return sanitized as T
}

export function randomString(): string {
  return (Math.random() + 1).toString(36).substring(7)
}

export function randomColor(): string {
  return Math.floor(Math.random() * 16777215).toString(16)
}

export function togglePasswordInput(node: FormNode): void {
  node.props.suffixIcon = node.props.suffixIcon === 'eye' ? 'eyeClosed' : 'eye'
  node.props.type = node.props.type === 'password' ? 'text' : 'password'
}
