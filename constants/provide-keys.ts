export const INITIATIVE_SHEET: InjectionKey<{
  sheet: Ref<InitiativeSheet | undefined>
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>) => Promise<void>
  activeRow: Ref<InitiativeSheetRow | undefined>
}> = Symbol('initiativeSheet')
