import { describe, expect, it } from 'vitest'
import { shallowRef } from 'vue'
import { memorySheetAdapter } from '~/utils/sheet-adapters'
import { sheet as fixture } from '~~/test/fixtures/initiative-sheet'

describe('memorySheetAdapter', () => {
  it('merges an update and reorders the rows by initiative', async () => {
    const sheet = shallowRef<InitiativeSheet | undefined>({ ...fixture })
    const [first, second] = fixture.rows

    await memorySheetAdapter(sheet).update({
      round: 3,
      rows: [
        { ...first!, initiative: 1 },
        { ...second!, initiative: 30 },
      ],
    })

    expect(sheet.value?.round).toBe(3)
    expect(sheet.value?.rows.map(row => [row.id, row.index])).toEqual([
      [second!.id, 0],
      [first!.id, 1],
    ])
  })

  it('merges edited rows onto changes made since', async () => {
    const [first, second] = fixture.rows
    const sheet = shallowRef<InitiativeSheet | undefined>({
      ...fixture,
      rows: [{ ...first!, hitPoints: 1 }, second!],
    })

    await memorySheetAdapter(sheet).update({
      baseRows: [first!, second!],
      rows: [first!, { ...second!, name: 'Renamed' }],
    })

    expect(sheet.value?.rows[0]?.hitPoints).toBe(1)
    expect(sheet.value?.rows[1]?.name).toBe('Renamed')
    expect(sheet.value).not.toHaveProperty('baseRows')
  })

  it('patches rows in place', async () => {
    const sheet = shallowRef<InitiativeSheet | undefined>({ ...fixture })
    const [first] = fixture.rows

    await memorySheetAdapter(sheet).patchRows([
      { rowId: first!.id, patch: { hitPoints: 1 } },
    ])

    expect(sheet.value?.rows[0]).toEqual({ ...first, hitPoints: 1 })
  })

  it('advances the turn and returns the reminders', async () => {
    const sheet = shallowRef<InitiativeSheet | undefined>({
      ...fixture,
      activeIndex: 0,
    })

    const reminders = await memorySheetAdapter(sheet).nextTurn()

    expect(sheet.value?.activeIndex).toBe(1)
    expect(reminders).toEqual(
      expect.objectContaining({ expired: expect.any(Array) }),
    )
  })

  it('does nothing without a sheet', async () => {
    const sheet = shallowRef<InitiativeSheet | undefined>()
    const adapter = memorySheetAdapter(sheet)

    await adapter.update({ round: 2 })
    await adapter.patchRows([{ rowId: 'a', patch: { hitPoints: 1 } }])

    expect(await adapter.nextTurn()).toBeUndefined()
    expect(sheet.value).toBeUndefined()
  })
})
