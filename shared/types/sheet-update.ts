export type InitiativeSheetUpdate = Partial<
  Pick<
    InitiativeSheet,
    'rows' | 'activeIndex' | 'round' | 'settings' | 'info' | 'infoCards'
  >
>

export interface RowPatch {
  rowId: string
  patch: Partial<InitiativeSheetRow>
}
