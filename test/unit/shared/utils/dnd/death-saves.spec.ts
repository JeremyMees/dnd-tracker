import { describe, expect, it } from 'vitest'

describe('dnd/deathsaves', () => {
  describe('hasDeathSaves', () => {
    it('should return correct values for different homebrew types', () => {
      expect(hasDeathSaves('summon')).toBeFalsy()
      expect(hasDeathSaves('lair')).toBeFalsy()
      expect(hasDeathSaves('monster')).toBeFalsy()
      expect(hasDeathSaves('player')).toBeTruthy()
      expect(hasDeathSaves('npc')).toBeTruthy()
    })
  })

  describe('checkDeathSaves', () => {
    it('should detect failed and saved outcomes', () => {
      expect(
        checkDeathSaves({
          fail: [true, true, true],
          save: [false, false, false],
        }),
      ).toEqual({ failed: true, saved: false })
      expect(
        checkDeathSaves({
          fail: [false, false, false],
          save: [true, true, true],
        }),
      ).toEqual({ failed: false, saved: true })
    })
  })

  describe('applyDeathSave', () => {
    it('should apply death saves', () => {
      const base = {
        fail: [false, false, false],
        save: [false, false, false],
      } as DndDeathSaves

      expect(applyDeathSave(base, 'fail').fail).toEqual([true, false, false])
      expect(applyDeathSave(base, 'save').save).toEqual([true, false, false])
    })

    it('should apply multiple death saves respecting count and next available slot', () => {
      const base = {
        fail: [false, false, false],
        save: [false, false, false],
      } as DndDeathSaves

      expect(applyDeathSave(base, 'fail', 0).fail).toEqual([
        false,
        false,
        false,
      ])
      expect(applyDeathSave(base, 'fail', 1).fail).toEqual([true, false, false])
      expect(applyDeathSave(base, 'save', 2).save).toEqual([true, true, false])
      expect(applyDeathSave(base, 'save', 3).save).toEqual([true, true, true])
      expect(applyDeathSave(base, 'save', 4).save).toEqual([true, true, true])
    })
  })

  describe('setDeathSaveCount', () => {
    const base: DndDeathSaves = {
      save: [false, true, false],
      fail: [true, false, false],
    }

    it('should fill the first slots up to the count', () => {
      expect(setDeathSaveCount(base, 'save', 2)).toEqual({
        save: [true, true, false],
        fail: [true, false, false],
      })
    })

    it('should clear every slot for a count of zero', () => {
      expect(setDeathSaveCount(base, 'fail', 0).fail).toEqual([
        false,
        false,
        false,
      ])
    })
  })

  describe('resetDeathSaves', () => {
    it('should reset death saves to all false', () => {
      expect(resetDeathSaves()).toEqual({
        fail: [false, false, false],
        save: [false, false, false],
      })
    })
  })
})
