import sanitize from 'sanitize-html'
import { allowedHTMLTags, allowedHTMLAttr } from '~~/constants/html-policy'

export function sanitizeServerHTML(dirty: string): string {
  return sanitize(dirty, {
    allowedTags: allowedHTMLTags,
    allowedAttributes: { '*': allowedHTMLAttr },
  })
}

export function escapeLikePattern(value: string): string {
  return value.replace(/([\\%_])/g, '\\$1')
}
