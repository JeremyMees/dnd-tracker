import '~~/test/unit/stubs/storage'
import { loadNuxtConfig } from '@nuxt/kit'
import { render } from '@maizzle/framework'
import seo from '~~/constants/seo'
import { fillEmailTemplate } from '~~/server/utils/email'

export type CompiledEmail = { html: string; text: string }

const maizzleConfig = loadNuxtConfig({ envName: 'test' }).then(
  ({ maizzle }) => ({
    ...maizzle,
    url: { base: { url: seo.url, tags: ['img'] } },
    vite: {
      cacheDir: `node_modules/.cache/maizzle-vitest-${process.env.VITEST_POOL_ID}`,
    },
  }),
)

export async function renderEmailSource(
  source: string,
): Promise<CompiledEmail> {
  const { html, plaintext } = await render(source, await maizzleConfig)

  return { html, text: plaintext ?? '' }
}

export function renderEmailTemplate(
  template: EmailTemplate,
): Promise<CompiledEmail> {
  return renderEmailSource(`app/emails/${template}.vue`)
}

export function fillEmail(
  compiled: CompiledEmail,
  values: Record<string, string | undefined>,
): CompiledEmail {
  return {
    html: fillEmailTemplate(compiled.html, values, 'html'),
    text: fillEmailTemplate(compiled.text, values, 'text'),
  }
}

export function classesWithoutDarkOverride(html: string): string[] {
  const darkRules =
    html.match(/@media \(prefers-color-scheme: dark\) \{([\s\S]*?)\n\}/)?.[1] ??
    ''
  const overridden = new Set(
    [...darkRules.matchAll(/\.([\w-]+) \{/g)].map(([, name]) => name),
  )

  return [...html.matchAll(/ class="([^"]*)"/g)]
    .flatMap(([, classes]) => classes!.split(' '))
    .filter(name => !overridden.has(name))
}
