import type { UseStorageOptions } from '@vueuse/core'
import type { LocationQuery } from 'vue-router'

export type FilterPersistence = 'url' | 'local' | 'session' | 'none'

export interface UseFilterStateOptions<T> {
  persist?: FilterPersistence
  codecs?: { [K in keyof T]?: FilterCodec<T[K]> }
}

const STORAGE_PREFIX = 'dnd-tracker:filters:'

export function useFilterState<T extends Record<string, unknown>>(
  key: string,
  defaults: T,
  options: UseFilterStateOptions<T> = {},
): { state: T; reset: () => void } {
  const persist = options.persist ?? 'none'
  const keys = Object.keys(defaults) as (keyof T & string)[]

  function codecFor<K extends keyof T & string>(name: K): FilterCodec<T[K]> {
    return options.codecs?.[name] ?? inferFilterCodec(defaults[name])
  }

  function cloneDefaults(): T {
    return Object.fromEntries(
      keys.map(name => [
        name,
        Array.isArray(defaults[name]) ? [...defaults[name]] : defaults[name],
      ]),
    ) as T
  }

  function sanitize(source: unknown): Partial<T> {
    if (!source || typeof source !== 'object') return {}

    const patch: Partial<T> = {}

    keys.forEach(name => {
      if (!(name in source)) return

      const value = sanitizeFilterValue(
        codecFor(name),
        (source as Record<string, unknown>)[name],
      )

      if (value !== undefined) patch[name] = value
    })

    return patch
  }

  function readQuery(query: LocationQuery): Partial<T> {
    const patch: Partial<T> = {}

    keys.forEach(name => {
      const raw = query[name]
      const value = Array.isArray(raw) ? raw.at(-1) : raw

      if (typeof value !== 'string') return

      const parsed = codecFor(name).parse(value)

      if (parsed !== undefined) patch[name] = parsed
    })

    return patch
  }

  function toQuery(current: LocationQuery): LocationQuery {
    const owned = new Set<string>(keys)
    const query: LocationQuery = Object.fromEntries(
      Object.entries(current).filter(([name]) => !owned.has(name)),
    )

    keys.forEach(name => {
      if (isSameFilterValue(state[name], defaults[name])) return

      query[name] = codecFor(name).serialize(state[name])
    })

    return query
  }

  const state = createState()

  function createState(): T {
    if (persist !== 'local' && persist !== 'session') {
      return reactive(cloneDefaults()) as T
    }

    const storageOptions: UseStorageOptions<T> = {
      mergeDefaults: (stored, fallback) => ({
        ...fallback,
        ...sanitize(stored),
      }),
      listenToStorageChanges: false,
      onError: () => {},
    }
    const storageKey = `${STORAGE_PREFIX}${key}`

    const store =
      persist === 'session'
        ? useSessionStorage<T>(storageKey, cloneDefaults(), storageOptions)
        : useLocalStorage<T>(storageKey, cloneDefaults(), storageOptions)

    return store.value
  }

  function apply(patch: Partial<T>): void {
    const next = { ...cloneDefaults(), ...patch }

    keys.forEach(name => {
      if (!isSameFilterValue(state[name], next[name])) state[name] = next[name]!
    })
  }

  function reset(): void {
    apply({})
  }

  if (persist === 'url') {
    const route = useRoute()
    const router = useRouter()

    apply(readQuery(route.query))

    watch(state, () => {
      const query = toQuery(route.query)

      if (isSameQuery(query, route.query)) return

      router.replace({ query })
    })

    watch(
      () => route.query,
      query => apply(readQuery(query)),
    )
  }

  return { state, reset }
}

function isSameQuery(a: LocationQuery, b: LocationQuery): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])

  return [...keys].every(key => String(a[key]) === String(b[key]))
}
