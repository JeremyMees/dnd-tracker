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
  const responseHeaders = new Map<string, string>()

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
      res: {
        setHeader: (name: string, value: string) =>
          responseHeaders.set(name.toLowerCase(), value),
        getHeader: (name: string) => responseHeaders.get(name.toLowerCase()),
        removeHeader: (name: string) =>
          responseHeaders.delete(name.toLowerCase()),
        hasHeader: (name: string) => responseHeaders.has(name.toLowerCase()),
        getHeaderNames: () => [...responseHeaders.keys()],
      },
    },
    _requestBody: body,
  } as unknown as H3Event
}

export function responseHeader(event: H3Event, name: string): string {
  return event.node.res.getHeader(name) as string
}
