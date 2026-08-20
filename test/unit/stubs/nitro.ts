import type { EventHandler } from 'h3'

export function defineCachedEventHandler<T extends EventHandler>(
  handler: T,
  _options?: unknown,
): T {
  return handler
}
