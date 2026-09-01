export interface FilterCodec<T> {
  parse: (raw: string) => T | undefined
  serialize: (value: T) => string
}

export function oneOfFilterCodec<T>(values: readonly T[]): FilterCodec<T> {
  return {
    parse: raw => values.find(value => String(value) === raw),
    serialize: value => String(value),
  }
}

export function inferFilterCodec<T>(defaultValue: T): FilterCodec<T> {
  if (Array.isArray(defaultValue)) {
    return {
      parse: raw =>
        raw
          .split(',')
          .map(part => part.trim())
          .filter(Boolean) as T,
      serialize: value => (value as unknown[]).join(','),
    }
  }

  if (typeof defaultValue === 'number') {
    return {
      parse: raw => {
        if (raw.trim() === '') return undefined

        const parsed = Number(raw)

        return Number.isFinite(parsed) ? (parsed as T) : undefined
      },
      serialize: value => String(value),
    }
  }

  if (typeof defaultValue === 'boolean') {
    return {
      parse: raw => {
        if (raw === 'true') return true as T
        if (raw === 'false') return false as T
        return undefined
      },
      serialize: value => String(value),
    }
  }

  if (typeof defaultValue === 'string') {
    return {
      parse: raw => raw as T,
      serialize: value => String(value),
    }
  }

  return {
    parse: () => undefined,
    serialize: value => String(value),
  }
}

export function isSameFilterValue(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false
    if (a.length !== b.length) return false

    return a.every((value, i) => value === b[i])
  }

  return a === b
}

export function sanitizeFilterValue<T>(
  codec: FilterCodec<T>,
  value: unknown,
): T | undefined {
  try {
    return codec.parse(codec.serialize(value as T))
  } catch {
    return undefined
  }
}
