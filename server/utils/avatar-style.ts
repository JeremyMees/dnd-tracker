import { OptionsDescriptor, Style } from '@dicebear/core'
import openPeeps from '@dicebear/styles/open-peeps.json' with { type: 'json' }
import type { ConfigStyleOptions } from '~~/shared/types/avatar'

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

const blackListedKeys = ['headContrastColor', 'inkColor', 'maskVariant']

let style: Style<typeof openPeeps> | undefined

export function getAvatarStyle(): Style<typeof openPeeps> {
  return (style ??= new Style(openPeeps))
}

export function buildStyleOptions(): ConfigStyleOptions {
  const avatarStyle = getAvatarStyle()
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
