export type TransferKind = 'encounters' | 'homebrews'

export type TransferErrorReason =
  | 'invalidFile'
  | 'unsupportedFile'
  | 'wrongKind'
  | 'tooLarge'
  | 'empty'
  | 'tooMany'

export type EncounterTransfer = Pick<
  InitiativeInsert,
  'title' | 'info' | 'rows' | 'settings' | 'infoCards' | 'round' | 'activeIndex'
>

export type HomebrewTransfer = Omit<
  HomebrewItemInsert,
  'id' | 'campaign' | 'createdAt'
>

export interface TransferItems {
  encounters: EncounterTransfer
  homebrews: HomebrewTransfer
}

export interface TransferFile<K extends TransferKind = TransferKind> {
  format: 'dnd-tracker'
  kind: K
  version: 1
  exportedAt: string
  items: TransferItems[K][]
}
