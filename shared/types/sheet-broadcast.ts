export interface SheetActionEvent {
  version: number
  row: string
  patch: Partial<InitiativeSheetRow>
}

export interface SheetSyncEvent {
  version: number
  sheet: Partial<InitiativeSheet>
  reminders?: TurnReminders
}
