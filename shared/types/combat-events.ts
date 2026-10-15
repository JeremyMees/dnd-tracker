export interface CombatEventDraft {
  type: CombatEventType
  payload: { [key: string]: Json | undefined }
}
