export interface CombatEventDraft {
  type: CombatEventType
  rowId?: string | null
  payload: { [key: string]: Json | undefined }
}
