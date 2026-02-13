import human from './human.json'
import elf from './elf.json'
import dwarf from './dwarf.json'
import halfling from './halfling.json'
import dragonborn from './dragonborn.json'
import gnome from './gnome.json'
import halfElf from './half-elf.json'
import halfOrc from './half-orc.json'
import tiefling from './tiefling.json'

type Content = Record<Gender, {
  first: string[]
  middle: string[]
  last: {
    prefixes: string[]
    suffixes: string[]
  }
}>

const names: Record<DndRace, Content> = {
  'human': human,
  'elf': elf,
  'dwarf': dwarf,
  'halfling': halfling,
  'dragonborn': dragonborn,
  'gnome': gnome,
  'half-elf': halfElf,
  'half-orc': halfOrc,
  'tiefling': tiefling,
} as const

const races: DndRace[] = ['human', 'elf', 'dwarf', 'halfling', 'dragonborn', 'gnome', 'half-elf', 'half-orc', 'tiefling']

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

const genders: Gender[] = ['male', 'female', 'nonbinary']

const genderOptions: Option<Gender | 'random'>[] = [
  { label: 'Random gender', value: 'random' },
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Non-binary', value: 'nonbinary' },
]

export {
  names,
  races,
  raceOptions,
  genders,
  genderOptions,
}
