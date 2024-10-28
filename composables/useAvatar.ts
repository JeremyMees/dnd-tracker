import type { StyleOptions } from '@dicebear/core'
import { createAvatar } from '@dicebear/core'
import { openPeeps } from '@dicebear/collection'
import { red, orange, yellow, emerald, sky, violet, pink, gray } from 'tailwindcss/colors'

const colors = [
  ...[red[100], red[200], red[300], red[400], red[500]],
  ...[orange[100], orange[200], orange[300], orange[400], orange[500]],
  ...[yellow[100], yellow[200], yellow[300], yellow[400], yellow[500]],
  ...[emerald[100], emerald[200], emerald[300], emerald[400], emerald[500]],
  ...[sky[100], sky[200], sky[300], sky[400], sky[500]],
  ...[violet[100], violet[200], violet[300], violet[400], violet[500]],
  ...[pink[100], pink[200], pink[300], pink[400], pink[500]],
  ...[gray[100], gray[200], gray[300], gray[400], gray[500]],
].map(color => color.replace('#', ''))

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
