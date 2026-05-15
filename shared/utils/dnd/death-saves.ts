function hasDeathSaves(type: HomebrewType): boolean {
  return !['summon', 'lair'].includes(type)
}

function checkDeathSaves(deathSaves: DndDeathSaves): { failed: boolean, saved: boolean } {
  return {
    failed: deathSaves.fail.every(v => v === true) || false,
    saved: deathSaves.save.every(v => v === true) || false,
  }
}

function applyDeathSave(
  deathSaves: DndDeathSaves, type: 'fail' | 'save' = 'fail',
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

function resetDeathSaves(): DndDeathSaves {
  return {
    fail: [false, false, false],
    save: [false, false, false],
  }
}

const deathSavesFunctions = {
  hasDeathSaves,
  applyDeathSave,
  checkDeathSaves,
  resetDeathSaves,
}

export {
  hasDeathSaves,
  applyDeathSave,
  checkDeathSaves,
  resetDeathSaves,
  deathSavesFunctions,
}
