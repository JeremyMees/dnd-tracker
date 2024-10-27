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

export function toggleSelection<T extends { id: number }>(item: T, selected: T[]): void {
  const index: number = selected.findIndex(s => s.id === item.id)

  if (index === -1) selected.push(item)
  else selected.splice(index, 1)
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
