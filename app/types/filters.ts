export type FilterPersistence = 'url' | 'local' | 'session' | 'none'

export interface FilterCodec<T> {
  parse: (raw: string) => T | undefined
  serialize: (value: T) => string
}

export interface UseFilterStateOptions<T> {
  persist?: FilterPersistence
  codecs?: { [K in keyof T]?: FilterCodec<T[K]> }
}
