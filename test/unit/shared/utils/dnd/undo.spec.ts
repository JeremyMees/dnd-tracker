import { describe, expect, it } from 'vitest'

function row(
  id: string,
  fields: Partial<InitiativeSheetRow> = {},
): InitiativeSheetRow {
  return {
    id,
    name: id,
    index: 0,
    initiative: 10,
    type: 'monster',
    conditions: [],
    ...fields,
  }
}

const prone: DndCondition = { id: 'prone', name: 'Prone', desc: '' }

describe('dnd/undo', () => {
  describe('revertRow', () => {
    it('restores the fields the change touched', () => {
      const before = row('a', { hitPoints: 20 })
      const after = row('a', { hitPoints: 12 })

      expect(revertRow(after, before, after).hitPoints).toBe(20)
    })

    it('keeps fields that changed since', () => {
      const before = row('a', { hitPoints: 20 })
      const after = row('a', { hitPoints: 12 })
      const current = row('a', { hitPoints: 12, conditions: [prone] })

      expect(revertRow(current, before, after)).toEqual(
        row('a', { hitPoints: 20, conditions: [prone] }),
      )
    })

    it('removes a field the change added', () => {
      const before = row('a', { hitPoints: 20, maxHitPoints: 20 })
      const after = row('a', {
        hitPoints: 30,
        maxHitPoints: 30,
        maxHitPointsOld: 20,
      })

      const reverted = revertRow(after, before, after)

      expect(reverted.maxHitPoints).toBe(20)
      expect('maxHitPointsOld' in reverted).toBe(false)
    })
  })

  describe('revertRows', () => {
    it('removes rows the change added', () => {
      const before = [row('a')]
      const after = [row('a'), row('goblin')]

      expect(revertRows(after, before, after).map(r => r.id)).toEqual(['a'])
    })

    it('brings back rows the change removed at their old place', () => {
      const before = [row('a'), row('b'), row('c')]
      const after = [row('a'), row('c')]

      expect(revertRows(after, before, after).map(r => r.id)).toEqual([
        'a',
        'b',
        'c',
      ])
    })

    it('restores the order the change moved', () => {
      const before = [row('a'), row('b')]
      const after = [row('b'), row('a')]

      expect(revertRows(after, before, after).map(r => r.id)).toEqual([
        'a',
        'b',
      ])
    })

    it('keeps rows added since and drops rows removed since', () => {
      const before = [row('a', { hitPoints: 10 }), row('b')]
      const after = [row('a', { hitPoints: 4 }), row('b')]
      const current = [row('a', { hitPoints: 4 }), row('wolf')]

      expect(revertRows(current, before, after)).toEqual([
        row('a', { hitPoints: 10, index: 0 }),
        row('wolf', { index: 1 }),
      ])
    })

    it('reindexes the rows', () => {
      const before = [row('a'), row('b')]
      const after = [row('b'), row('a')]

      expect(revertRows(after, before, after).map(r => r.index)).toEqual([0, 1])
    })
  })

  describe('mergeRows', () => {
    it('applies the edited fields and keeps fields changed since', () => {
      const base = [row('a', { hitPoints: 20, name: 'Goblin' })]
      const current = [row('a', { hitPoints: 6, name: 'Goblin' })]
      const edited = [row('a', { hitPoints: 20, name: 'Goblin boss' })]

      expect(mergeRows(current, base, edited)).toEqual([
        row('a', { hitPoints: 6, name: 'Goblin boss' }),
      ])
    })

    it('adds and removes the rows the edit added and removed', () => {
      const base = [row('a'), row('b')]

      expect(
        mergeRows(base, base, [row('a'), row('c')]).map(({ id }) => id),
      ).toEqual(['a', 'c'])
    })

    it('keeps rows added since and drops rows removed since', () => {
      const base = [row('a'), row('b')]
      const current = [row('a'), row('c')]

      expect(mergeRows(current, base, base).map(({ id }) => id)).toEqual([
        'a',
        'c',
      ])
    })

    it('follows the order of the edit', () => {
      const base = [row('a'), row('b')]

      expect(
        mergeRows(base, base, [row('b'), row('a')]).map(({ id }) => id),
      ).toEqual(['b', 'a'])
    })
  })

  describe('mergeSheetUpdate', () => {
    it('merges the rows when the update says what they were edited from', () => {
      const base = [row('a', { hitPoints: 20 })]
      const current = [row('a', { hitPoints: 6 })]

      expect(
        mergeSheetUpdate(current, {
          round: 2,
          baseRows: base,
          rows: [row('a', { hitPoints: 20, note: 'Angry' })],
        }),
      ).toEqual({
        round: 2,
        rows: [row('a', { hitPoints: 6, note: 'Angry' })],
      })
    })

    it('takes the rows as they are without a base', () => {
      const rows = [row('b')]

      expect(mergeSheetUpdate([row('a')], { rows })).toEqual({ rows })
    })

    it('leaves an update without rows alone', () => {
      expect(mergeSheetUpdate([row('a')], { round: 3 })).toEqual({ round: 3 })
    })
  })

  describe('revertSheet', () => {
    it('restores the turn when the change moved it', () => {
      const before = { rows: [row('a'), row('b')], activeIndex: 1, round: 2 }
      const after = { rows: [row('a'), row('b')], activeIndex: 0, round: 3 }

      expect(revertSheet(after, { before, after })).toMatchObject({
        activeIndex: 1,
        round: 2,
      })
    })

    it('keeps the current turn when the change did not move it', () => {
      const before = {
        rows: [row('a', { hitPoints: 5 })],
        activeIndex: 0,
        round: 1,
      }
      const after = {
        rows: [row('a', { hitPoints: 1 })],
        activeIndex: 0,
        round: 1,
      }
      const current = { ...after, activeIndex: 0, round: 4 }

      expect(revertSheet(current, { before, after })).toMatchObject({
        activeIndex: 0,
        round: 4,
      })
    })
  })

  describe('snapshotSheet', () => {
    it('copies a reactive sheet', () => {
      const sheet = reactive({ rows: [row('a')], activeIndex: 0, round: 1 })

      expect(snapshotSheet(sheet)).toEqual({
        rows: [row('a')],
        activeIndex: 0,
        round: 1,
      })
    })

    it('copies the rows and turn without sharing references', () => {
      const sheet = { rows: [row('a')], activeIndex: 0, round: 1 }

      const snapshot = snapshotSheet(sheet)

      sheet.rows[0]!.name = 'changed'

      expect(snapshot).toEqual({ rows: [row('a')], activeIndex: 0, round: 1 })
    })
  })

  describe('patchesBetween', () => {
    const current: SheetSnapshot = {
      rows: [row('a', { hitPoints: 5 }), row('b', { index: 1, hitPoints: 8 })],
      activeIndex: 0,
      round: 1,
    }

    it('returns a patch with the changed fields of each changed row', () => {
      expect(
        patchesBetween(current, {
          ...current,
          rows: [
            row('a', { hitPoints: 20, conditions: [prone] }),
            current.rows[1]!,
          ],
        }),
      ).toEqual([{ rowId: 'a', patch: { hitPoints: 20, conditions: [prone] } }])
    })

    it('returns no patches when nothing changed', () => {
      expect(patchesBetween(current, current)).toEqual([])
    })

    it.each([
      ['the turn moved', { ...current, activeIndex: 1 }],
      [
        'a row was added',
        { ...current, rows: [...current.rows, row('c', { index: 2 })] },
      ],
      [
        'the rows were reordered',
        { ...current, rows: [current.rows[1]!, current.rows[0]!] },
      ],
      [
        'a field was removed',
        { ...current, rows: [row('a'), current.rows[1]!] },
      ],
      [
        'a field a patch cannot set changed',
        {
          ...current,
          rows: [row('a', { hitPoints: 5, initiative: 3 }), current.rows[1]!],
        },
      ],
    ])('needs a whole write when %s', (_label, target) => {
      expect(patchesBetween(current, target)).toBeUndefined()
    })
  })
})
