export function randomArrayItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function randomArrayItems<T>(arr: T[], number = 1): T[] {
  const result: T[] = []
  const copy = [...arr]

  if (number >= arr.length) {
    return shuffleArray(arr)
  }

  for (let i = 0; i < number; i++) {
    const index = Math.floor(Math.random() * copy.length)
    result.push(copy.splice(index, 1)[0])
  }

  return result
}

export function searchArray<T>(arr: T[], key: keyof T, search: string): T[] {
  return arr
    .filter(item => (item[key] as string)
      .toLowerCase()
      .includes(search.toLowerCase().trim() || ''),
    )
}

export function shuffleArray<T>(arr: T[]): T[] {
  for (let i = 0; i < arr.length; i++) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = arr[i]
    arr[i] = arr[j]
    arr[j] = temp
  }

  return arr
}

export function splitArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []

  for (let i = 0; i < size; i++) {
    result.push(arr.filter((_, index) => index % size === i))
  }

  return result
}

export function sortArray<T extends Record<string, any>>(arr: T[], key: string, acs = true): T[] {
  return [...arr].sort((a: T, b: T) => {
    const aValue = getValueFromNestedKeys<T>(a, key)
    const bValue = getValueFromNestedKeys<T>(b, key)

    return typeof aValue === 'number' || Array.isArray(aValue)
      ? sortByNumber(aValue, bValue, acs)
      : sortByString(aValue, bValue, acs)
  })
}

export function toggleArray<T extends { id: number }>(item: T, selected: T[]): T[] {
  const arr = [...selected]
  const index: number = arr.findIndex(s => s.id === item.id)

  if (index === -1) arr.push(item)
  else arr.splice(index, 1)

  return arr
}
