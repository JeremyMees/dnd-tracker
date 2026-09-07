export interface Avatar {
  url: string
  extra: Record<string, unknown>
}

export type SelectedStyleOptions = Record<string, string | number>

export interface ConfigStyleOption {
  hasProbability: boolean
  isColor: boolean
  values: string[]
}

export type ConfigStyleOptions = Record<string, ConfigStyleOption>
