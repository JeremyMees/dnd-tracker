import type { EventHookOn } from '@vueuse/core'

export const INITIATIVE_SHEET: InjectionKey<{
  sheet: Ref<InitiativeSheet | undefined>
  update: (
    payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>,
  ) => Promise<void>
  patchRow: (rowId: string, patch: Partial<InitiativeSheetRow>) => Promise<void>
  nextTurn: () => Promise<TurnReminders | undefined>
  onTurnReminders?: EventHookOn<TurnReminders>
  activeRow: Ref<InitiativeSheetRow | undefined>
}> = Symbol('initiativeSheet')
