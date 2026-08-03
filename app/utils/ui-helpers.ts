import DOMPurify from 'dompurify'
import { allowedHTMLAttr, allowedHTMLTags } from '~~/constants/html-policy'

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

export function sortByNumber(a: unknown, b: unknown, acs: boolean): number {
  const aNum = Array.isArray(a) ? a.length : a
  const bNum = Array.isArray(b) ? b.length : b

  if (typeof aNum !== 'number') return typeof bNum === 'number' ? 1 : 0
  if (typeof bNum !== 'number') return -1

  return acs ? aNum - bNum : bNum - aNum
}

export function sortByString(a: unknown, b: unknown, acs: boolean): number {
  const aStr = typeof a === 'string' ? a : ''
  const bStr = typeof b === 'string' ? b : ''

  return acs ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
}

export function sortCreatedAt<T extends { createdAt: string }>(arr: T[]): T[] {
  return arr.sort((a, b) => {
    return new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf()
  })
}

export function homebrewIcon(type: HomebrewType): string {
  switch (type) {
    case 'summon':
      return 'tabler:wand'
    case 'npc':
      return 'tabler:user'
    case 'monster':
      return 'tabler:bat'
    case 'lair':
      return 'tabler:building-castle'
    default:
      return 'tabler:sword'
  }
}

export function homebrewBgColor(type: HomebrewType): string {
  switch (type) {
    case 'summon':
      return 'bg-tertiary'
    case 'npc':
      return 'bg-success'
    case 'monster':
      return 'bg-destructive'
    case 'lair':
      return 'bg-warning'
    default:
      return 'bg-primary'
  }
}

export function homebrewColor(type: HomebrewType): string {
  switch (type) {
    case 'summon':
      return 'text-tertiary'
    case 'npc':
      return 'text-success'
    case 'monster':
      return 'text-destructive'
    case 'lair':
      return 'text-warning'
    default:
      return 'text-primary'
  }
}

export function sanitizeClientHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: allowedHTMLTags,
    ALLOWED_ATTR: allowedHTMLAttr,
  }).replaceAll('<hr />', '<hr>')
}

export function formatDate(date: string | Date): string {
  const { locale } = useI18n()

  const formatter = new Intl.DateTimeFormat(locale.value, {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  })

  return formatter.format(new Date(date))
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

export function validateParamId(id: string | string[] | undefined): number {
  if (!id || typeof id !== 'string' || isNaN(+id))
    throw createError({ status: 404, statusText: 'Id is not valid' })

  return +id
}

export function validateInject<T>(key: InjectionKey<T>): T {
  const injection = inject(key)

  if (!injection)
    throw createError({ status: 500, statusText: 'Injection not found' })

  return injection
}

export function animateTableUpdate(id: string, color: 'green' | 'red'): void {
  const el = document.getElementById(id)

  if (!el) return

  el.style.animation = 'none'
  void el.offsetHeight
  el.style.animation = `pulse-${color} 1s ease-in-out`

  setTimeout(() => {
    if (el) el.style.animation = ''
  }, 1000)
}
