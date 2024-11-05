import type { StyleOptions } from '@dicebear/core'
import { createAvatar } from '@dicebear/core'
import { openPeeps } from '@dicebear/collection'

const colors = [
  'fee2e2', 'fecaca', 'fca5a5', 'f87171', 'ef4444', // red
  'ffedd5', 'fed7aa', 'fdba74', 'fb923c', 'f97316', // orange
  'fef9c3', 'fef08a', 'fde047', 'facc15', 'eab308', // yellow
  'd1fae5', 'a7f3d0', '6ee7b7', '34d399', '10b981', // green
  'e0f2fe', 'bae6fd', '7dd3fc', '38bdf8', '0ea5e9', // blue
  'ede9fe', 'ddd6fe', 'c4b5fd', 'a78bfa', '8b5cf6', // purple
  'fce7f3', 'fbcfe8', 'f9a8d4', 'f472b6', 'ec4899', // pink
  'f3f4f6', 'e5e7eb', 'd1d5db', '9ca3af', '6b7280', // gray
]

const blackListedKeys = [
  'style',
  'headContrastColor',
  'mask',
  'backgroundType',
  'secondaryBackgroundColor',
  'backgroundRotation',
]

export type SelectedStyleOptions = Record<string, string | number>
export type ConfigStyleOptions = Record<string, ConfigStyleOption>
export type Avatar = { url: string, extra: Record<string, unknown> }

type ConfigStyleOption = {
  hasProbability?: boolean
  probability: number
  isColor?: boolean
  isArray?: boolean
  values: string[]
}

export function useAvatarCreator() {
  const avatar = ref<Avatar>()
  const options = ref<SelectedStyleOptions>({})
  const configStyleOptions: ConfigStyleOptions = getSchemaOptions(openPeeps.schema)

  function update(selectedOptions: SelectedStyleOptions): void {
    for (const key in selectedOptions) {
      if (blackListedKeys.includes(key)) continue
      else if (key === 'primaryBackgroundColor') {
        options.value.backgroundColor = selectedOptions[key]
      }
      else options.value[key] = selectedOptions[key]
    }

    generate()
  }

  function random(): void {
    options.value = {
      ...Object.fromEntries(
        Object.entries(configStyleOptions).map(([key, { values }]) => {
          let value = randomArrayItem(values)

          if (key.includes('Color') && !value.toString().includes('#')) {
            value = `#${value}`
          }

          return [key, value]
        }),
      ),
    }

    const generatedAvatar = createAvatar(openPeeps, getAvatarOptions(true))

    avatar.value = {
      url: generatedAvatar.toDataUri(),
      extra: generatedAvatar.toJson().extra,
    }
  }

  function generate(): void {
    const generatedAvatar = createAvatar(openPeeps, getAvatarOptions())

    avatar.value = {
      url: generatedAvatar.toDataUri(),
      extra: generatedAvatar.toJson().extra,
    }
  }

  function getAvatarOptions(random: boolean = false): Record<string, unknown> {
    const result: StyleOptions<any> = {
      size: 100,
      scale: 75,
      seed: 'dnd',
    }

    for (const key in options.value) {
      if (
        !options.value[key]
        || blackListedKeys.includes(key)
      ) continue

      const avatarOption = options.value[key]
      const styleOption = configStyleOptions[key]

      if (styleOption.isArray) {
        result[key] = avatarOption
          ? [avatarOption.toString().replace('#', '')]
          : []
      }
      else result[key] = avatarOption

      if (styleOption.hasProbability) {
        result[`${key}Probability`] = avatarOption ? 100 : random ? 50 : 0
      }
    }

    return result
  }

  function getSchemaOptions(schema: any): ConfigStyleOptions {
    const result: ConfigStyleOptions = {}
    const properties: Record<string, any> = {
      backgroundColor: {
        type: 'array',
        items: {
          type: 'string',
          pattern: '^(transparent|[a-fA-F0-9]{6})$',
        },
      },
      ...schema.properties,
    }

    for (const key in properties) {
      if (!properties[key] || blackListedKeys.includes(key)) continue

      const property = properties[key]

      if (typeof property === 'boolean') {
        continue
      }

      const isColor = !!key.match(/Color$/)
      const isArray = property.type === 'array'
      const isBackgroundColor = key === 'backgroundColor'
      const probability = properties[`${key}Probability`]
      const hasProbability = typeof probability === 'object'

      const values = new Set<string>()

      if (hasProbability) values.add('')

      if (property.enum) {
        for (const value of property.enum) {
          if (typeof value === 'string') {
            values.add(value)
          }
        }
      }

      if (property.default && Array.isArray(property.default)) {
        for (const value of property.default) {
          if (typeof value === 'string') {
            values.add(value)
          }
        }
      }

      if (
        typeof property.items === 'object'
        && !Array.isArray(property.items)
        && property.items.enum
      ) {
        for (const value of property.items.enum) {
          if (typeof value === 'string') {
            values.add(value)
          }
        }
      }

      if (values.size <= 1) {
        if (!isBackgroundColor) continue

        for (const fallbackBackgroundColor of colors) {
          values.add(fallbackBackgroundColor)
        }
      }

      if (isBackgroundColor && values.has('transparent')) {
        values.delete('transparent')
        values.add('ffffff')
      }

      result[key] = {
        values: Array.from(values.values()),
        isColor,
        isArray,
        hasProbability,
        probability: hasProbability ? (probability.default as number) : 100,
      }
    }

    return result
  }

  return {
    avatar,
    options,
    configStyleOptions,
    blackListedKeys,
    update,
    generate,
    random,
    getAvatarOptions,
  }
}
