import { avatarStyleOptions } from '~~/constants/avatar-options'
import type {
  ConfigStyleOptions,
  SelectedStyleOptions,
} from '~~/shared/types/avatar'

const legacyKeys: Record<string, string> = {
  accessories: 'accessoriesVariant',
  face: 'expressionVariant',
  facialHair: 'facialHairVariant',
  head: 'headVariant',
  mask: 'maskVariant',
  primaryBackgroundColor: 'backgroundColor',
}

export function getStyleOptions(): ConfigStyleOptions {
  return avatarStyleOptions
}

export function normalizeStyleOptions(
  selected: SelectedStyleOptions,
): SelectedStyleOptions {
  const configStyleOptions = getStyleOptions()
  const result: SelectedStyleOptions = {}

  for (const rawKey in selected) {
    const key = legacyKeys[rawKey] ?? rawKey
    const value = selected[rawKey]

    if (value === undefined || !configStyleOptions[key]) continue

    result[key] = value
  }

  return result
}
