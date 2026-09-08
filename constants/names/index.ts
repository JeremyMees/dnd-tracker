const races: DndRace[] = [
  'human',
  'elf',
  'dwarf',
  'halfling',
  'dragonborn',
  'gnome',
  'half-elf',
  'half-orc',
  'tiefling',
]

const raceOptions: Option<DndRace | 'random'>[] = [
  { label: 'Random race', value: 'random' },
  { label: 'Human', value: 'human' },
  { label: 'Elf', value: 'elf' },
  { label: 'Dwarf', value: 'dwarf' },
  { label: 'Halfling', value: 'halfling' },
  { label: 'Dragonborn', value: 'dragonborn' },
  { label: 'Gnome', value: 'gnome' },
  { label: 'Half-Elf', value: 'half-elf' },
  { label: 'Half-Orc', value: 'half-orc' },
  { label: 'Tiefling', value: 'tiefling' },
]

const genders: DndGender[] = ['male', 'female', 'nonbinary']

const genderOptions: Option<DndGender | 'random'>[] = [
  { label: 'Random gender', value: 'random' },
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Non-binary', value: 'nonbinary' },
]

export { races, raceOptions, genders, genderOptions }
