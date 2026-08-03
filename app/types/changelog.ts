export interface Changelog {
  version: string
  date: string
  features: {
    title: string
    items: { text: string }[]
  }[]
}
