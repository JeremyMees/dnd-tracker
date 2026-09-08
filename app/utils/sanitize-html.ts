import { allowedHTMLAttr, allowedHTMLTags } from '~~/constants/html-policy'

export type HtmlSanitizer = (dirty: string) => string

let pending: Promise<typeof import('dompurify').default> | undefined

function loadPurifier(): Promise<typeof import('dompurify').default> {
  pending ??= import('dompurify').then(({ default: purify }) => purify)

  return pending
}

export async function loadMarkdownSanitizer(): Promise<HtmlSanitizer> {
  const purify = await loadPurifier()

  return (dirty: string) => purify.sanitize(dirty)
}

export async function sanitizeClientHTML(dirty: string): Promise<string> {
  const purify = await loadPurifier()

  return purify
    .sanitize(dirty, {
      ALLOWED_TAGS: allowedHTMLTags,
      ALLOWED_ATTR: allowedHTMLAttr,
    })
    .replaceAll('<hr />', '<hr>')
}
