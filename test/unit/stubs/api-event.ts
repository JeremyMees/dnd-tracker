import type { H3Event } from 'h3'

export function mockEvent({
  method = 'GET',
  body,
  path = '/',
  headers = {},
  params,
}: {
  method?: string
  body?: unknown
  path?: string
  headers?: Record<string, string>
  params?: Record<string, string>
} = {}): H3Event {
  return {
    path,
    method,
    context: { params },
    node: {
      req: {
        method,
        headers: {
          ...(body !== undefined && { 'content-type': 'application/json' }),
          ...headers,
        },
        socket: { remoteAddress: '127.0.0.1' },
      },
    },
    _requestBody: body,
  } as unknown as H3Event
}
