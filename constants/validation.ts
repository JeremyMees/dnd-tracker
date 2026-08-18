export const maxHealthAndArmour = 1000

export const initiativeSpacingOptions = [
  'compact',
  'normal',
  'cozy',
] as const satisfies readonly TableSpacing[]

export const initiativeDefaultRows = [
  'armorClass',
  'hitPoints',
  'conditions',
  'note',
  'deathSaves',
  'concentration',
  'modify',
] as const satisfies readonly InitiativeRowField[]

export const initiativePets = [
  'cat',
  'chicken',
  'barmaid',
  'crawler',
  'dragon',
  'fairy',
  'redcap',
  'wolf-rider',
] as const satisfies readonly InitiativePet[]

export const initiativeWidgets = [
  'dice-roll',
  'fantasy-name-generator',
  'note',
  'info-pins',
] as const satisfies readonly InitiativeWidget[]

export const widgetLabels: Record<InitiativeWidget, string> = {
  'dice-roll': 'general.diceRoll',
  'fantasy-name-generator': 'general.fantasyNameGenerator',
  note: 'general.note',
  'info-pins': 'general.infoPins',
}

export const homebrewType = [
  'player',
  'summon',
  'npc',
  'monster',
  'lair',
] as const satisfies readonly HomebrewType[]

export const claimableRowTypes = [
  'player',
  'npc',
] as const satisfies readonly HomebrewType[]

export const abilityType = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
] as const satisfies readonly DndAbility[]

export const actionType = [
  'action',
  'bonusAction',
  'reaction',
  'legendaryAction',
  'mythicAction',
  'specialAbility',
  'lairAction',
] as const satisfies readonly DndActionType[]

export const roleType = [
  'Admin',
  'Viewer',
] as const satisfies readonly UserRole[]

export const campaignTransferRole = ['Admin', 'Viewer', 'Remove'] as const
