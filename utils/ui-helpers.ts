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

export function scrollToId(id: string): void {
  const el = document.getElementById(id)

  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }
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

export function sortByNumber(a: number | any[], b: number | any[], acs: boolean): number {
  a = Array.isArray(a) ? a.length : a
  b = Array.isArray(b) ? b.length : b

  if (a == null) {
    return b == null ? 0 : 1
  }
  else if (b == null) {
    return -1
  }

  return acs ? a - b : b - a
}

export function sortByString(a: string, b: string, acs: boolean): number {
  a = a ?? ''
  b = b ?? ''

  return acs ? a.localeCompare(b) : b.localeCompare(a)
}

export function sortCreatedAt<T extends { created_at: string }>(arr: T[]): T[] {
  return arr.sort((a, b) => {
    return new Date(b.created_at).valueOf() - new Date(a.created_at).valueOf()
  })
}

export function focusInput({ node }: any): void {
  const id = node?.context?.id

  if (id) document.getElementById(id)?.focus()
}
