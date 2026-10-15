import sanitize from 'sanitize-html'

const htmlEscapes: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

const section = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g
const placeholder = /\{\{\{\s*(\w+)\s*\}\}\}|\{\{\s*(\w+)\s*\}\}/g
const maizzleDevServer = 'http://localhost:4321'

function escapeHTML(value: string): string {
  return value.replace(/[&<>"']/g, char => htmlEscapes[char]!)
}

const blockBoundary = /<\/(?:p|h[1-6]|li|blockquote|pre|div)>|<br\s*\/?>/gi

function stripHTML(value: string): string {
  return sanitize(value.replace(blockBoundary, '$&\n'), {
    allowedTags: [],
    allowedAttributes: {},
  }).trim()
}

export function fillEmailTemplate(
  template: string,
  values: Record<string, string | undefined>,
  format: 'html' | 'text',
): string {
  return template
    .replace(section, (_, key: string, content: string) =>
      values[key] ? content : '',
    )
    .replace(placeholder, (_, rawKey, escapedKey) => {
      const key: string = rawKey ?? escapedKey
      const value = values[key]

      if (value === undefined) {
        throw new Error(`Missing email value for "${key}"`)
      }

      if (format === 'text') return rawKey ? stripHTML(value) : value

      return rawKey ? value : escapeHTML(value)
    })
}

function fetchFromMaizzleDevServer(
  endpoint: 'render' | 'plaintext',
  template: EmailTemplate,
): Promise<string> {
  return $fetch<string>(
    `${maizzleDevServer}/__maizzle/${endpoint}/app/emails/${template}`,
    { responseType: 'text' },
  )
}

async function loadEmailTemplate(
  template: EmailTemplate,
): Promise<{ html: string; text: string }> {
  if (import.meta.dev) {
    const [html, text] = await Promise.all([
      fetchFromMaizzleDevServer('render', template),
      fetchFromMaizzleDevServer('plaintext', template),
    ])

    return { html, text }
  }

  const storage = useStorage('assets:server')
  const [html, text] = await Promise.all([
    storage.getItem<string>(`emails:${template}.html`),
    storage.getItem<string>(`emails:${template}.txt`),
  ])

  if (!html || !text) {
    throw new Error(`Compiled email template "${template}" not found`)
  }

  return { html, text }
}

export async function renderEmail<T extends EmailTemplate>(
  template: T,
  values: EmailValues[T],
): Promise<{ html: string; text: string }> {
  const { html, text } = await loadEmailTemplate(template)

  return {
    html: fillEmailTemplate(html, values, 'html'),
    text: fillEmailTemplate(text, values, 'text'),
  }
}
