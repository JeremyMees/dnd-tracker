import { Avatar as DiceBearAvatar } from '@dicebear/core'
import type { StyleOptions } from '@dicebear/core'
import type openPeeps from '@dicebear/styles/open-peeps.json'
import type { Avatar, SelectedStyleOptions } from '~~/shared/types/avatar'

export function getAvatarOptions(
  selected: SelectedStyleOptions,
): StyleOptions<typeof openPeeps> {
  const configStyleOptions = getStyleOptions()
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
  const configStyleOptions = getStyleOptions()
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

export function generateAvatar(selected: SelectedStyleOptions): Avatar {
  const generatedAvatar = new DiceBearAvatar(
    getAvatarStyle(),
    getAvatarOptions(selected),
  )

  return {
    url: generatedAvatar.toDataUri(),
    extra: getAvatarExtra(generatedAvatar),
  }
}
