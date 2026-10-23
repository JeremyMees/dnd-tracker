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

export type SheetTurn = Pick<InitiativeSheet, 'activeIndex' | 'round'>

export interface SheetSeatOrigin {
  session: string
}

export interface SheetLiveSession {
  uuid: string
  seats: LiveSeat[]
}

export interface SheetStore {
  read: (encounterId: number) => Promise<StoredSheet>
  patchRows: (
    encounterId: number,
    patches: RowPatch[],
  ) => Promise<InitiativeSheetRow[]>
  updateTurn: (
    encounterId: number,
    from: SheetTurn,
    to: SheetTurn & Partial<Pick<InitiativeSheet, 'rows'>>,
  ) => Promise<TurnSheet | undefined>
  updateSheet: (
    encounterId: number,
    update: InitiativeSheetFields,
  ) => Promise<void>
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
