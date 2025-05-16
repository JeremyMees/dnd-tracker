import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCoolDown } from '~/composables/useCoolDown'

describe('useCoolDown', () => {
  let coolDown: ReturnType<typeof useCoolDown>

  beforeEach(() => {
    coolDown = useCoolDown()
    vi.useFakeTimers()
  })

  it('should start a cool down', () => {
    coolDown.startCoolDown(1, 10)

    expect(Object.keys(coolDown.coolDowns).length).toBe(1)
    expect(coolDown.getRemainingTime(1)).toBe(10)
  })

  it('should be possible to start multiple cool downs', () => {
    coolDown.startCoolDown(1, 10)
    coolDown.startCoolDown(2, 10)
    coolDown.startCoolDown(3, 10)

    expect(Object.keys(coolDown.coolDowns).length).toBe(3)
  })

  it('should not start a cool down if it is already in progress', () => {
    coolDown.startCoolDown(1, 10)
    coolDown.startCoolDown(1, 10)

    expect(Object.keys(coolDown.coolDowns).length).toBe(1)
  })

  it('should remove a cool down when it is finished', () => {
    coolDown.startCoolDown(1, 3)

    vi.advanceTimersByTime(4000)

    expect(Object.keys(coolDown.coolDowns).length).toBe(0)
  })

  it('should return the remaining time of a cool down', () => {
    coolDown.startCoolDown(1, 10)

    vi.advanceTimersByTime(3000)

    expect(coolDown.getRemainingTime(1)).toBe(7)
  })

  it('should return if the item is in a cool down', () => {
    coolDown.startCoolDown(1, 10)

    expect(coolDown.isInCoolDown(1)).toBeTruthy()
    expect(coolDown.isInCoolDown(2)).toBeFalsy()
  })
})
