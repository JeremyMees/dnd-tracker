export const playerRow: PlayerRow = {
  id: 'row-1',
  index: 0,
  initiative: 15,
  name: 'Elara',
  type: 'player',
  conditions: [],
}

export const playerSheet: PlayerSheet = {
  id: 1,
  title: 'Goblin Ambush',
  round: 2,
  activeIndex: 1,
  rows: [
    { ...playerRow },
    {
      id: 'row-2',
      index: 1,
      initiative: 18,
      name: 'Goblin 1',
      type: 'monster',
      conditions: [],
    },
  ],
}
