import sanitizeHtml from 'sanitize-html'

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
  node.props.suffixIcon = node.props.suffixIcon === 'tabler:eye' ? 'tabler:eye-closed' : 'tabler:eye'
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

export function homebrewIcon(type: HomebrewType): string {
  switch (type) {
    case 'summon': return 'tabler:wand'
    case 'npc': return 'tabler:user'
    case 'monster': return 'tabler:bat'
    case 'lair': return 'tabler:building-castle'
    default: return 'tabler:sword'
  }
}

export function homebrewBgColor(type: HomebrewType): string {
  switch (type) {
    case 'summon': return 'bg-tertiary'
    case 'npc': return 'bg-success'
    case 'monster': return 'bg-destructive'
    case 'lair': return 'bg-warning'
    default: return 'bg-primary'
  }
}

export function homebrewColor(type: HomebrewType): string {
  switch (type) {
    case 'summon': return 'text-tertiary'
    case 'npc': return 'text-success'
    case 'monster': return 'text-destructive'
    case 'lair': return 'text-warning'
    default: return 'text-primary'
  }
}

export function sanitizeHTML(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: ['h1', 'h2', 'h3', 'p', 'a', 'ol', 'ul', 'li', 'blockquote', 'hr', 'mark', 'strong', 'em', 's'],
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel'],
    },
  }).replaceAll('<hr />', '<hr>')
}

export function formatDate(date: string | Date): string {
  const { locale } = useI18n()

  const formatter = new Intl.DateTimeFormat(
    locale.value,
    {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
    },
  )

  return formatter.format(new Date(date))
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

export function validateParamId(id: string | string[] | undefined): number {
  if (
    !id
    || typeof id !== 'string'
    || isNaN(+id)
  ) throw createError({ statusCode: 404, statusMessage: 'Id is not valid' })

  return +id
}
