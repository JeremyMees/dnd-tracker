import { firstName, lastName, middleName } from '~/constants/names.json'

export function randomName(): string {
  const first = randomArrayItem(firstName)
  const last = randomArrayItem(lastName.prefixes) + randomArrayItem(lastName.suffixes)

  if (Math.random() <= 0.10) {
    return `${first} ${randomArrayItem(middleName)} ${last}`
  }

  return `${first} ${last}`
}

export function randomRoll(max: number): number {
  return Math.floor(Math.random() * max) + 1
}

export function rollDice(dice: number, amount = 1): number[] {
  const rolls: number[] = []

  for (let i = 0; i < amount; i++) {
    rolls.push(randomRoll(+dice))
  }

  return rolls
}
