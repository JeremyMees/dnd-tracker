export function hasDeathSaves(type: HomebrewType): boolean {
  return ['player', 'npc'].includes(type)
}

export function checkDeathSaves(deathSaves: DndDeathSaves): {
  failed: boolean
  saved: boolean
} {
  return {
    failed: deathSaves.fail.every(v => v === true) || false,
    saved: deathSaves.save.every(v => v === true) || false,
  }
}

export function applyDeathSave(
  deathSaves: DndDeathSaves,
  type: 'fail' | 'save' = 'fail',
  count: number = 1,
): DndDeathSaves {
  const updatedSaves = { ...deathSaves }
  const updated = [...updatedSaves[type]]
  let addedCount = 0

  for (let i = 0; i < updated.length && addedCount < count; i++) {
    if (!updated[i]) {
      updated[i] = true
      addedCount++
    }
  }

  updatedSaves[type] = updated as [boolean, boolean, boolean]

  return updatedSaves
}

export function setDeathSaveCount(
  deathSaves: DndDeathSaves,
  type: 'fail' | 'save',
  count: number,
): DndDeathSaves {
  return {
    ...deathSaves,
    [type]: deathSaves[type].map((_, i) => i < count) as [
      boolean,
      boolean,
      boolean,
    ],
  }
}

export function resetDeathSaves(): DndDeathSaves {
  return {
    fail: [false, false, false],
    save: [false, false, false],
  }
}
