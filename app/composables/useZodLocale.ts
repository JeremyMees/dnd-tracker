import { z } from 'zod'

function localeConfig(code: string): z.core.$ZodConfig {
  return code === 'nl' ? z.locales.nl() : z.locales.en()
}

export function useZodLocale(): void {
  if (import.meta.server) return

  const { locale } = useI18n()

  watchEffect(() => z.config(localeConfig(locale.value)))
}
