export interface SheetAdapter {
  update: (data: UpdateInitiativeSheetData) => Promise<void>
  patchRows: (patches: RowPatch[]) => Promise<void>
  nextTurn: () => Promise<TurnReminders | undefined>
}

export type SheetFieldsUpdate = Omit<UpdateInitiativeSheetData, 'rows'>
