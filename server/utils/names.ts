import { races, genders } from '~~/constants/names'
import human from '../data/names/human.json'
import elf from '../data/names/elf.json'
import dwarf from '../data/names/dwarf.json'
import halfling from '../data/names/halfling.json'
import dragonborn from '../data/names/dragonborn.json'
import gnome from '../data/names/gnome.json'
import halfElf from '../data/names/half-elf.json'
import halfOrc from '../data/names/half-orc.json'
import tiefling from '../data/names/tiefling.json'

const MIDDLE_NAME_CHANCE = 0.1

type NamePool = Record<
  DndGender,
  {
    first: string[]
    middle: string[]
    last: {
      prefixes: string[]
      suffixes: string[]
    }
  }
>

const pools: Record<DndRace, NamePool> = {
  human: human,
  elf: elf,
  dwarf: dwarf,
  halfling: halfling,
  dragonborn: dragonborn,
  gnome: gnome,
  'half-elf': halfElf,
  'half-orc': halfOrc,
  tiefling: tiefling,
}

function randomize<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T
}

export function randomName(race?: DndRace, gender?: DndGender): string {
  const selectedRace = race ?? randomize(races)
  const selectedGender = gender ?? randomize(genders)

  const pool = pools[selectedRace]?.[selectedGender]

  if (!pool) return 'Unknown'

  const first = randomize(pool.first)
  const last = randomize(pool.last.prefixes) + randomize(pool.last.suffixes)

  if (Math.random() <= MIDDLE_NAME_CHANCE && pool.middle.length > 0) {
    return `${first} ${randomize(pool.middle)} ${last}`
  }

  return `${first} ${last}`
}

export function randomNames(
  amount: number,
  race?: DndRace,
  gender?: DndGender,
): string[] {
  return Array.from({ length: amount }, () => randomName(race, gender))
}
