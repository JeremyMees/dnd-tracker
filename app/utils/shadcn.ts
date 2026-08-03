import type { Updater } from '@tanstack/vue-table'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export type ObjectValues<T> = T[keyof T]

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function valueUpdater<T>(updaterOrValue: Updater<T>, ref: Ref) {
  ref.value =
    typeof updaterOrValue === 'function'
      ? (updaterOrValue as (old: T) => T)(ref.value)
      : updaterOrValue
}
