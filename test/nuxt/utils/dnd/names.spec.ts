import { afterEach, describe, expect, it, vi } from 'vitest'
import { randomName } from '~~/shared/utils/dnd/names'

describe('dnd/names', () => {
  afterEach(() => vi.restoreAllMocks())

  it('should generate a name with first and last name', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    const name = randomName()

    expect(name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/)
  })

  it('should include a middle name when probability is met', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.05)

    const name = randomName()

    expect(name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+$/)
  })

  it('should generate race and gender specific names', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    expect(randomName('elf', 'female')).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/)
    expect(randomName('dragonborn', 'male')).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/)
    expect(randomName('human', 'nonbinary')).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/)
  })

  it('should return Unknown when race data cannot be resolved', () => {
    const name = randomName('unknown-race' as DndRace, 'male')
    expect(name).toBe('Unknown')
  })
})
