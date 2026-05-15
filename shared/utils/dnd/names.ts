import { names, races, genders } from '~~/constants/names'

export function randomName(race?: DndRace, gender?: DndGender): string {
  const selectedRace = race ?? randomArrayItem(races)
  const selectedGender = gender ?? randomArrayItem(genders)

  const raceData = names[selectedRace]?.[selectedGender]

  if (!raceData) return 'Unknown'

  const first = randomArrayItem(raceData.first)
  const last = randomArrayItem(raceData.last.prefixes) + randomArrayItem(raceData.last.suffixes)

  if (Math.random() <= 0.10 && raceData.middle.length > 0) {
    return `${first} ${randomArrayItem(raceData.middle)} ${last}`
  }

  return `${first} ${last}`
}
