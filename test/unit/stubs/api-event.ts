import type { H3Event } from 'h3'

export function mockEvent({
  method = 'GET',
  body,
  path = '/',
  headers = {},
}: {
  method?: string
  body?: unknown
  path?: string
  headers?: Record<string, string>
} = {}): H3Event {
  return {
    path,
    method,
    node: {
      req: {
        method,
        headers: {
          ...(body !== undefined && { 'content-type': 'application/json' }),
          ...headers,
        },
      },
    },
    _requestBody: body,
  } as unknown as H3Event
}
