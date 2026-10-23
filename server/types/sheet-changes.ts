export type StoredSheet = Pick<
  InitiativeSheet,
  | 'id'
  | 'title'
  | 'round'
  | 'activeIndex'
  | 'rows'
  | 'settings'
  | 'info'
  | 'infoCards'
>

export interface SheetRowPatch {
  rowId: string
  patch: Partial<InitiativeSheetRow>
}

export interface SheetLiveSession {
  uuid: string
  seats: LiveSeat[]
}

export interface SheetStore {
  read: (encounterId: number) => Promise<StoredSheet>
  patchRows: (
    encounterId: number,
    patches: SheetRowPatch[],
  ) => Promise<InitiativeSheetRow[]>
  liveSession: (encounterId: number) => Promise<SheetLiveSession | undefined>
  logEvents: (events: TablesInsert<'combat_events'>[]) => Promise<void>
}

export type SheetTopic =
  { kind: 'sheet'; encounterId: number } | { kind: 'live'; session: string }

export interface SheetBroadcaster {
  nextVersion: (topic: SheetTopic) => Promise<number>
  send: (topic: SheetTopic, event: string, payload: object) => Promise<void>
}

export interface SheetActor {
  id?: string | null
  name?: string | null
}

export interface SheetChangeContext {
  store: SheetStore
  broadcaster: SheetBroadcaster
  encounterId: number
  actor: SheetActor
}
