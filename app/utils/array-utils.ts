export function randomArrayItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T
}

export function searchArray<T>(arr: T[], key: keyof T, search: string): T[] {
  return arr.filter(item =>
    (item[key] as string)
      .toLowerCase()
      .includes(search.toLowerCase().trim() || ''),
  )
}

export function splitArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []

  for (let i = 0; i < size; i++) {
    result.push(arr.filter((_, index) => index % size === i))
  }

  return result
}

export function sortArray<T extends Record<string, unknown>>(
  arr: T[],
  key: string,
  acs = true,
): T[] {
  return [...arr].sort((a: T, b: T) => {
    const aValue = getValueFromNestedKeys(a, key)
    const bValue = getValueFromNestedKeys(b, key)

    return typeof aValue === 'number' || Array.isArray(aValue)
      ? sortByNumber(aValue, bValue, acs)
      : sortByString(aValue, bValue, acs)
  })
}

export function toggleArray<T extends { id: number }>(
  item: T,
  selected: T[],
): T[] {
  const arr = [...selected]
  const index: number = arr.findIndex(s => s.id === item.id)

  if (index === -1) arr.push(item)
  else arr.splice(index, 1)

  return arr
}

export function isEqualArray<T>(arr1: T[], arr2: T[]): boolean {
  if (arr1.length !== arr2.length) return false

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false
  }

  return true
}

export function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}
