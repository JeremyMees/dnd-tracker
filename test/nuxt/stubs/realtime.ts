import { vi } from 'vitest'

type BroadcastHandler = (arg: { payload: unknown }) => void

interface FakeChannel {
  topic: string
  handlers: Map<string, BroadcastHandler>
  status?: (status: string) => void
  on: ReturnType<typeof vi.fn>
  subscribe: ReturnType<typeof vi.fn>
  track: ReturnType<typeof vi.fn>
}

function fakeChannel(topic: string): FakeChannel {
  const channel: FakeChannel = {
    topic,
    handlers: new Map(),
    on: vi.fn((_type: string, { event }: { event: string }, handler) => {
      channel.handlers.set(event, handler)
      return channel
    }),
    subscribe: vi.fn((status: (status: string) => void) => {
      channel.status = status
      return channel
    }),
    track: vi.fn(),
  }

  return channel
}

export const realtime = {
  channels: [] as FakeChannel[],
  client: {
    channel: (topic: string) => {
      const channel = fakeChannel(topic)
      realtime.channels.push(channel)
      return channel
    },
    removeChannel: vi.fn(),
  },
  latest(): FakeChannel | undefined {
    return realtime.channels.at(-1)
  },
  emit(event: string, payload: unknown): void {
    realtime.latest()?.handlers.get(event)?.({ payload })
  },
  join(): void {
    realtime.latest()?.status?.('SUBSCRIBED')
  },
  reset(): void {
    realtime.channels = []
    realtime.client.removeChannel.mockClear()
  },
}
