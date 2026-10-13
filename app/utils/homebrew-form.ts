export const homebrewTabs = [
  'info',
  'stats',
  'traits',
  'actions',
] as const satisfies readonly HomebrewTab[]

const homebrewTabFields: Partial<Record<HomebrewTab, string[]>> = {
  stats: ['abilityScores', 'modifiers', 'savingThrows', 'skillBonuses'],
  traits: ['traits', 'resistancesAndImmunities'],
  actions: ['actions'],
}

export function homebrewTabOf(path: string): HomebrewTab {
  const field = path.split(/[.[]/)[0]!

  return (
    homebrewTabs.find(tab => homebrewTabFields[tab]?.includes(field)) ?? 'info'
  )
}

export function invalidHomebrewTabs(
  errors: Partial<Record<string, string>>,
): HomebrewTab[] {
  const paths = Object.keys(errors).filter(path => errors[path])

  return homebrewTabs.filter(tab =>
    paths.some(path => homebrewTabOf(path) === tab),
  )
}

export function toHomebrewSubmission(
  values: HomebrewFormValues,
): HomebrewSubmission {
  const { amount, initiative, initiativeModifier, summoner, ...data } = values

  return {
    row: data as InitiativeSheetRowInsert,
    homebrew: {
      ...data,
      ...(isDefined(initiativeModifier)
        ? { initiativeModifier: initiativeModifier.toString() }
        : {}),
    } as HomebrewData,
    amount,
    initiative,
    initiativeModifier,
    summoner,
  }
}
