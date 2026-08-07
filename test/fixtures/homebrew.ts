export const mockHomebrewItem: HomebrewItemRow = {
  id: 1,
  campaign: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  name: 'Goblin Boss',
  type: 'monster',
  player: null,
  link: null,
  actions: [],
  abilityScores: null,
  armorClass: 17,
  armorDetail: null,
  hitDice: null,
  hitPoints: 21,
  initiativeModifier: '2',
  languages: null,
  modifiers: null,
  passivePerception: null,
  proficiencyBonus: null,
  resistancesAndImmunities: null,
  savingThrows: null,
  sight: null,
  skillBonuses: null,
  speed: null,
  traits: null,
}

export const mockHomebrewPlayer: HomebrewItemRow = {
  ...mockHomebrewItem,
  id: 2,
  name: 'Kees',
  type: 'player',
  player: 'Jeremy',
  armorClass: 15,
  hitPoints: 32,
  initiativeModifier: '3',
}

export const mockHomebrewSummon: HomebrewItemRow = {
  ...mockHomebrewItem,
  id: 3,
  name: 'Spirit Wolf',
  type: 'summon',
  armorClass: 13,
  hitPoints: 18,
  initiativeModifier: null,
}

export const mockHomebrewListing: HomebrewItemRow[] = [
  mockHomebrewItem,
  mockHomebrewPlayer,
  mockHomebrewSummon,
]
