import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Config, DriveStep } from 'driver.js'
import examples from '~~/constants/initiative-examples.json'
import { useTour } from '~/composables/useTour'

const { driverMock, updateProfileMock, loaded } = vi.hoisted(() => ({
  driverMock: vi.fn(),
  updateProfileMock: vi.fn(),
  loaded: { driver: 0, css: 0 },
}))

vi.mock('driver.js', () => {
  loaded.driver++

  return { driver: driverMock }
})

vi.mock('driver.js/dist/driver.css', () => {
  loaded.css++

  return {}
})

vi.mock('~/queries/profiles', () => ({
  useProfileUpdate: () => ({ mutateAsync: updateProfileMock }),
}))

const drive = vi.fn()
const destroy = vi.fn()
const hasNextStep = vi.fn(() => true)
const confirmMock = vi.fn(() => false)

const user = ref<{ id: string; completedTour: boolean } | undefined>()
const tourCompleted = ref<boolean | undefined>()

mockNuxtImport('useAuthentication', () => () => ({ user }))
mockNuxtImport('useCookie', () => () => tourCompleted)

function driverConfig(): Config {
  expect(driverMock).toHaveBeenCalled()

  return driverMock.mock.calls.at(-1)![0] as Config
}

function driverSteps(): DriveStep[] {
  return driverConfig().steps ?? []
}

// The driver.js hooks are sync, but `close` behind them is not.
function closeTour(hook: keyof Config): Promise<void> {
  const config = driverConfig()

  ;(config[hook] as (...args: unknown[]) => void)(
    undefined,
    driverSteps()[0]!,
    {},
  )

  return nextTick()
}

describe('useTour', () => {
  beforeEach(() => {
    clearNuxtState()

    user.value = undefined
    tourCompleted.value = undefined

    driverMock.mockReturnValue({ drive, destroy, hasNextStep })
    hasNextStep.mockReturnValue(true)
    vi.stubGlobal('confirm', confirmMock)
  })

  it('Should have the correct API', () => {
    const tour = useTour()

    expect(tour).toHaveProperty('tourData')
    expect(tour).toHaveProperty('isTourActive')
    expect(tour).toHaveProperty('startTour')
  })

  it('Should only load driver.js and the example sheet once the tour starts', async () => {
    vi.resetModules()
    Object.assign(loaded, { driver: 0, css: 0 })

    const { useTour } = await import('~/composables/useTour')
    const { startTour, tourData } = useTour()

    expect(loaded).toEqual({ driver: 0, css: 0 })
    expect(tourData.value).toBeUndefined()

    await startTour()

    expect(loaded).toEqual({ driver: 1, css: 1 })
    expect(tourData.value?.rows.length).toBe(examples.rows.length)
  })

  it('Should load the example sheet and drive the tour', async () => {
    const { startTour, isTourActive, tourData } = useTour()

    await startTour()

    expect(isTourActive.value).toBe(true)
    expect(tourData.value?.title).toBe(examples.title)
    expect(tourData.value?.rows.length).toBe(examples.rows.length)
    expect(drive).toHaveBeenCalled()
  })

  it('Should skip the campaign step outside of a campaign', async () => {
    const { startTour } = useTour()

    await startTour(false)

    const elements = driverSteps().map(step => step.element)

    expect(elements.length).toBe(12)
    expect(elements).not.toContain('#tour-5')
  })

  it('Should include the campaign step inside a campaign', async () => {
    const { startTour } = useTour()

    await startTour(true)

    const elements = driverSteps().map(step => step.element)

    expect(elements.length).toBe(13)
    expect(elements).toContain('#tour-5')
  })

  it('Should translate the step copy and end on the giphy embed', async () => {
    const { startTour } = useTour()

    await startTour(true)

    const steps = driverSteps()

    expect(steps[0]!.popover?.title).toBe('tour.0.title')
    expect(steps[0]!.popover?.description).toBe('tour.0.description')
    expect(steps.at(-1)!.popover?.description).toContain('giphy')
  })

  it('Should not start when the cookie marks the tour as completed', async () => {
    tourCompleted.value = true

    const { startTour, isTourActive, tourData } = useTour()

    await startTour()

    expect(driverMock).not.toHaveBeenCalled()
    expect(isTourActive.value).toBe(false)
    expect(tourData.value).toBeUndefined()
  })

  it('Should wait for an in-flight profile fetch before deciding whether to start', async () => {
    user.value = { id: 'user-1', completedTour: false }

    const { startTour, isTourActive } = useTour()

    const promise = startTour()

    await nextTick()

    user.value = { id: 'user-1', completedTour: true }

    await promise

    expect(driverMock).not.toHaveBeenCalled()
    expect(isTourActive.value).toBe(false)
  })

  it('Should not start when the profile marks the tour as completed', async () => {
    user.value = { id: 'user-1', completedTour: true }

    const { startTour, isTourActive, tourData } = useTour()

    await startTour()

    expect(driverMock).not.toHaveBeenCalled()
    expect(isTourActive.value).toBe(false)
    expect(tourData.value).toBeUndefined()
  })

  it('Should reset the state and set the cookie when an anonymous tour closes', async () => {
    const { startTour, isTourActive, tourData } = useTour()

    await startTour()
    await closeTour('onDestroyed')

    expect(tourCompleted.value).toBe(true)
    expect(updateProfileMock).not.toHaveBeenCalled()
    expect(isTourActive.value).toBe(false)
    expect(tourData.value).toBeUndefined()
    expect(destroy).toHaveBeenCalled()
  })

  it('Should persist completion on the profile when a signed in tour closes', async () => {
    const { startTour, isTourActive } = useTour()

    await startTour()

    user.value = { id: 'user-1', completedTour: false }

    await closeTour('onCloseClick')

    expect(updateProfileMock).toHaveBeenCalledWith({
      data: { completedTour: true },
      id: 'user-1',
    })
    expect(tourCompleted.value).toBeUndefined()
    expect(isTourActive.value).toBe(false)
  })

  it('Should ask for confirmation before closing an unfinished tour', async () => {
    const { startTour, isTourActive } = useTour()

    await startTour()
    await closeTour('onDestroyStarted')

    expect(confirmMock).toHaveBeenCalledWith('tour.sure')
    expect(isTourActive.value).toBe(true)

    confirmMock.mockReturnValue(true)

    await closeTour('onDestroyStarted')

    expect(isTourActive.value).toBe(false)
  })

  it('Should close a finished tour without confirmation', async () => {
    const { startTour, isTourActive } = useTour()

    await startTour()

    hasNextStep.mockReturnValue(false)

    await closeTour('onDestroyStarted')

    expect(confirmMock).not.toHaveBeenCalled()
    expect(isTourActive.value).toBe(false)
  })
})
