export type InitiativeSheetFields = Partial<
  Pick<
    InitiativeSheet,
    'rows' | 'activeIndex' | 'round' | 'settings' | 'info' | 'infoCards'
  >
>

export type InitiativeSheetUpdate = InitiativeSheetFields & {
  baseRows?: InitiativeSheetRow[]
}

export interface RowPatch {
  rowId: string
  patch: Partial<InitiativeSheetRow>
}
