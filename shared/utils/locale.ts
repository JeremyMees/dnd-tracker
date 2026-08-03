import type { LocaleObject } from '@nuxtjs/i18n'

export const defaultLocale = 'en'

export const locales: LocaleObject[] = [
  {
    code: 'en',
    language: 'en-US',
    name: 'English',
    icon: '🇬🇧',
    file: 'en.json',
  },
  {
    code: 'nl',
    language: 'nl-BE',
    name: 'Nederlands',
    icon: '🇧🇪',
    file: 'nl.json',
  },
]

export function localeParam(locale: string): string {
  return locale === defaultLocale ? '' : `/${locale}`
}

export function localized<T>(rules: Record<string, T>): Record<string, T> {
  return Object.fromEntries(
    Object.entries(rules).flatMap(([path, rule]) =>
      locales.map(({ code }): [string, T] => [
        code === defaultLocale ? path : `/${code}${path === '/' ? '' : path}`,
        rule,
      ]),
    ),
  )
}
