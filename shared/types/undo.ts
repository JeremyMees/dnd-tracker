export type SheetSnapshot = Pick<
  InitiativeSheet,
  'rows' | 'activeIndex' | 'round'
>

export interface UndoEntry {
  before: SheetSnapshot
  after: SheetSnapshot
}
