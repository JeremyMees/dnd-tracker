import type { Updater } from '@tanstack/vue-table'

export { cn } from 'cn'

export type ObjectValues<T> = T[keyof T]

export function valueUpdater<T>(updaterOrValue: Updater<T>, ref: Ref) {
  ref.value =
    typeof updaterOrValue === 'function'
      ? (updaterOrValue as (old: T) => T)(ref.value)
      : updaterOrValue
}
