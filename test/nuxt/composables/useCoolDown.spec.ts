import { mountSuspended } from '@nuxt/test-utils/runtime'
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

    expect(coolDown.coolDowns.size).toBe(1)
    expect(coolDown.getRemainingTime(1)).toBe(10)
  })

  it('should be possible to start multiple cool downs', () => {
    coolDown.startCoolDown(1, 10)
    coolDown.startCoolDown(2, 10)
    coolDown.startCoolDown(3, 10)

    expect(coolDown.coolDowns.size).toBe(3)
  })

  it('should not start a cool down if it is already in progress', () => {
    coolDown.startCoolDown(1, 10)
    coolDown.startCoolDown(1, 10)

    expect(coolDown.coolDowns.size).toBe(1)
  })

  it('should remove a cool down when it is finished', () => {
    coolDown.startCoolDown(1, 3)

    vi.advanceTimersByTime(4000)

    expect(coolDown.coolDowns.size).toBe(0)
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

  it('should return 0 as the remaining time for an unknown id', () => {
    expect(coolDown.getRemainingTime(999)).toBe(0)
  })

  it('should clear all cool downs and stop their intervals', () => {
    coolDown.startCoolDown(1, 10)
    coolDown.startCoolDown(2, 10)

    coolDown.clearAllCoolDowns()

    expect(coolDown.coolDowns.size).toBe(0)

    vi.advanceTimersByTime(5000)

    expect(coolDown.coolDowns.size).toBe(0)
  })

  it('should clear all cool downs automatically when the owning component unmounts', async () => {
    const Probe = defineComponent({
      setup() {
        return useCoolDown()
      },
      template: '<div />',
    })

    const component = await mountSuspended(Probe)
    const vm = component.vm as unknown as ReturnType<typeof useCoolDown>

    vm.startCoolDown(1, 10)

    expect(vm.coolDowns.size).toBe(1)

    component.unmount()

    expect(vm.coolDowns.size).toBe(0)
  })
})
