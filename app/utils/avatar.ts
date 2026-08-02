import type { Avatar as DiceBearAvatar, StyleOptions } from '@dicebear/core'
import { OptionsDescriptor, Style } from '@dicebear/core'
import openPeeps from '@dicebear/styles/open-peeps.json' with { type: 'json' }

export const avatarStyle = new Style(openPeeps)

const backgroundColors = [
  'fee2e2',
  'fecaca',
  'fca5a5',
  'f87171',
  'ef4444', // red
  'ffedd5',
  'fed7aa',
  'fdba74',
  'fb923c',
  'f97316', // orange
  'fef9c3',
  'fef08a',
  'fde047',
  'facc15',
  'eab308', // yellow
  'd1fae5',
  'a7f3d0',
  '6ee7b7',
  '34d399',
  '10b981', // green
  'e0f2fe',
  'bae6fd',
  '7dd3fc',
  '38bdf8',
  '0ea5e9', // blue
  'ede9fe',
  'ddd6fe',
  'c4b5fd',
  'a78bfa',
  '8b5cf6', // purple
  'fce7f3',
  'fbcfe8',
  'f9a8d4',
  'f472b6',
  'ec4899', // pink
  'f3f4f6',
  'e5e7eb',
  'd1d5db',
  '9ca3af',
  '6b7280', // gray
]

const blackListedKeys = ['headContrastColor', 'maskVariant']

// DiceBear v9 stored avatar options under different names, map them so
// avatars saved before the v10 upgrade keep rendering the same way.
const legacyKeys: Record<string, string> = {
  accessories: 'accessoriesVariant',
  face: 'expressionVariant',
  facialHair: 'facialHairVariant',
  head: 'headVariant',
  mask: 'maskVariant',
  primaryBackgroundColor: 'backgroundColor',
}

export type SelectedStyleOptions = Record<string, string | number>
export type ConfigStyleOptions = Record<string, ConfigStyleOption>

type ConfigStyleOption = {
  hasProbability: boolean
  isColor: boolean
  values: string[]
}

export function getStyleOptions(): ConfigStyleOptions {
  const descriptor = new OptionsDescriptor(avatarStyle).toJSON()
  const colors = avatarStyle.colors()
  const result: ConfigStyleOptions = {}

  for (const key in descriptor) {
    const field = descriptor[key]

    if (!field || blackListedKeys.includes(key)) continue

    if (field.type === 'color') {
      const palette = colors.get(key.replace(/Color$/, ''))?.values()

      result[key] = {
        isColor: true,
        hasProbability: false,
        values: palette?.map(color => color.replace('#', '')) ?? [
          ...backgroundColors,
        ],
      }

      continue
    }

    if (field.type !== 'enum' || !key.endsWith('Variant')) continue

    const component = avatarStyle.components().get(key.replace(/Variant$/, ''))
    const hasProbability = (component?.probability() ?? 100) < 100

    result[key] = {
      isColor: false,
      hasProbability,
      values: hasProbability ? ['', ...field.values] : [...field.values],
    }
  }

  return result
}

export const configStyleOptions: ConfigStyleOptions = getStyleOptions()

export function normalizeStyleOptions(
  selected: SelectedStyleOptions,
): SelectedStyleOptions {
  const result: SelectedStyleOptions = {}

  for (const rawKey in selected) {
    const key = legacyKeys[rawKey] ?? rawKey
    const value = selected[rawKey]

    if (value === undefined || !configStyleOptions[key]) continue

    result[key] = value
  }

  return result
}

export function getAvatarOptions(
  selected: SelectedStyleOptions,
): StyleOptions<typeof openPeeps> {
  const result: Record<string, unknown> = {
    size: 100,
    scale: 0.75,
    seed: 'dnd',
  }

  for (const key in selected) {
    const value = selected[key]
    const styleOption = configStyleOptions[key]

    if (!styleOption) continue

    if (!value) {
      if (styleOption.hasProbability) {
        result[key.replace(/Variant$/, 'Probability')] = 0
      }

      continue
    }

    result[key] = styleOption.isColor
      ? `#${value.toString().replace('#', '')}`
      : value

    if (styleOption.hasProbability) {
      result[key.replace(/Variant$/, 'Probability')] = 100
    }
  }

  return result
}

export function getAvatarExtra(
  generatedAvatar: DiceBearAvatar,
): SelectedStyleOptions {
  const resolved = generatedAvatar.toJSON().options as Record<string, unknown>
  const extra: SelectedStyleOptions = {}

  for (const key in configStyleOptions) {
    const resolvedValue = resolved[key]
    const value = Array.isArray(resolvedValue)
      ? resolvedValue[0]
      : resolvedValue

    if (typeof value === 'string' || typeof value === 'number') {
      extra[key] = value
    } else if (configStyleOptions[key]?.hasProbability) {
      extra[key] = ''
    }
  }

  return extra
}
