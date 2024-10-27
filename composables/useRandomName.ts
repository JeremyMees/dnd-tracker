import { firstName, lastName, middleName } from '~/constants/names.json'

export function useRandomName(): string {
  const first = randomArrayItem(firstName)
  const last = randomArrayItem(lastName.prefixes) + randomArrayItem(lastName.suffixes)

  if (Math.random() <= 0.10) {
    return `${first} ${randomArrayItem(middleName)} ${last}`
  }

  return `${first} ${last}`
}
