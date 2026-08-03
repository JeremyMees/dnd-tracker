import sanitize from 'sanitize-html'
import { allowedHTMLTags, allowedHTMLAttr } from '~~/constants/html-policy'

export function sanitizeServerHTML(dirty: string): string {
  return sanitize(dirty, {
    allowedTags: allowedHTMLTags,
    allowedAttributes: { '*': allowedHTMLAttr },
  })
}
