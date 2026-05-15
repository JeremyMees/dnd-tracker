export function normalizeKey(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? ''
}

export function formatChallengeRating(cr: number): string {
  if (cr === 0.125) return '1/8'
  if (cr === 0.25) return '1/4'
  if (cr === 0.5) return '1/2'
  return String(cr)
}

export function splitList(input: string | null | undefined): string[] {
  if (!input) return []

  return input
    .split(/,|;/g)
    .map(item => item.trim())
    .filter(Boolean)
}

export function parseNumber(value: string | number | null | undefined, fallback = 0): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback
  if (typeof value !== 'string') return fallback

  const trimmed = value.trim()

  if (!trimmed) return fallback

  const fraction = trimmed.match(/^(\d+)\/(\d+)$/)

  if (fraction?.[1] && fraction[2]) {
    const numerator = Number.parseInt(fraction[1], 10)
    const denominator = Number.parseInt(fraction[2], 10)

    if (denominator) return numerator / denominator

    return fallback
  }

  const parsed = Number.parseFloat(trimmed)

  return Number.isFinite(parsed) ? parsed : fallback
}

export function parseIntegerFromText(value: string | number | null | undefined, fallback = 0): number {
  if (typeof value === 'number') return Number.isFinite(value) ? Math.trunc(value) : fallback
  if (typeof value !== 'string') return fallback

  const match = value.match(/-?\d+/)

  if (!match?.[0]) return fallback

  const parsed = Number.parseInt(match[0], 10)

  return Number.isFinite(parsed) ? parsed : fallback
}

export function parseBoolean(value: string | boolean | number | null | undefined): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value !== 'string') return false

  return ['1', 'true', 'yes', 'required'].includes(normalizeKey(value))
}
