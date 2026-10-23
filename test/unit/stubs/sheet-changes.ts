import { vi } from 'vitest'
import { topicName } from '~~/server/utils/sheet-adapters'

const hoisted = vi.hoisted(() => ({
  adapters: {} as {
    store?: SheetStore
    broadcaster?: SheetBroadcaster
  },
}))

vi.mock('~~/server/utils/sheet-adapters', async importOriginal => ({
  ...(await importOriginal<object>()),
  supabaseSheetStore: () => hoisted.adapters.store,
  realtimeBroadcaster: () => hoisted.adapters.broadcaster,
}))

export interface SheetMessage {
  topic: string
  event: string
  payload: Record<string, unknown>
}

interface MemorySheetOptions {
  liveSession?: SheetLiveSession
}

function asJsonb<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

export function storedSheet(overrides: Partial<StoredSheet> = {}): StoredSheet {
  return {
    id: 7,
    title: 'Ambush',
    round: 1,
    activeIndex: 0,
    rows: [],
    settings: { spacing: 'normal', modified: false },
    info: null,
    infoCards: [],
    ...overrides,
  } as StoredSheet
}

export function memorySheet(
  sheet: StoredSheet,
  { liveSession }: MemorySheetOptions = {},
) {
  const state = {
    sheet: asJsonb(sheet),
    events: [] as TablesInsert<'combat_events'>[],
    messages: [] as SheetMessage[],
  }
  const versions = new Map<string, number>()

  const store: SheetStore = {
    read: async () => asJsonb(state.sheet),
    patchRows: async (_encounterId, patches) => {
      const byRow = new Map(patches.map(({ rowId, patch }) => [rowId, patch]))

      state.sheet.rows = state.sheet.rows.map(row => {
        const patch = byRow.get(row.id)

        return patch ? asJsonb({ ...row, ...patch }) : row
      })

      return asJsonb(state.sheet.rows.filter(row => byRow.has(row.id)))
    },
    updateTurn: async (_encounterId, from, to) => {
      if (
        state.sheet.activeIndex !== from.activeIndex ||
        state.sheet.round !== from.round
      ) {
        return undefined
      }

      state.sheet = asJsonb({ ...state.sheet, ...to })

      const { id, title, round, activeIndex, rows, settings } = state.sheet

      return asJsonb({ id, title, round, activeIndex, rows, settings })
    },
    liveSession: async () => liveSession,
    logEvents: async events => {
      state.events.push(...events)
    },
  }

  const broadcaster: SheetBroadcaster = {
    nextVersion: async topic => {
      const name = topicName(topic)
      const version = (versions.get(name) ?? 0) + 1

      versions.set(name, version)

      return version
    },
    send: async (topic, event, payload) => {
      state.messages.push({
        topic: topicName(topic),
        event,
        payload: payload as Record<string, unknown>,
      })
    },
  }

  return {
    state,
    store,
    broadcaster,
    sent: (topic: string) =>
      state.messages.filter(message => message.topic === topic),
  }
}

export function memorySheetContext(
  sheet: StoredSheet,
  options: MemorySheetOptions & { actor?: SheetActor } = {},
) {
  const memory = memorySheet(sheet, options)
  const ctx: SheetChangeContext = {
    store: memory.store,
    broadcaster: memory.broadcaster,
    encounterId: sheet.id,
    actor: options.actor ?? { id: 'user-1' },
  }

  return { ...memory, ctx }
}

export function useMemorySheet(
  sheet: StoredSheet,
  options: MemorySheetOptions = {},
) {
  const memory = memorySheet(sheet, options)

  hoisted.adapters.store = memory.store
  hoisted.adapters.broadcaster = memory.broadcaster

  return memory
}
