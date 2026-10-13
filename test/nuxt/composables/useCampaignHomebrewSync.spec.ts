import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCampaignHomebrewSync } from '~/composables/useCampaignHomebrewSync'
import { maxCampaignHomebrews } from '~~/constants/validation'

const { createHomebrew, updateHomebrew, count, countArgs } = vi.hoisted(() => ({
  createHomebrew: vi.fn(),
  updateHomebrew: vi.fn(),
  count: { value: 0 as number | undefined },
  countArgs: vi.fn(),
}))

vi.mock('~/queries/homebrews', () => ({
  useHomebrewCreate: () => ({ mutateAsync: createHomebrew }),
  useHomebrewUpdate: () => ({ mutateAsync: updateHomebrew }),
  useHomebrewCount: (id: number, enabled: ComputedRef<boolean>) => {
    countArgs(id, enabled)

    return { data: count }
  },
}))

const data = { name: 'Grommash', type: 'npc' } as HomebrewData
const onError = vi.fn()

function setup(
  options: Partial<Parameters<typeof useCampaignHomebrewSync>[0]> = {},
) {
  return useCampaignHomebrewSync({
    campaignId: 4,
    countEnabled: true,
    onError,
    ...options,
  })
}

function countEnabled(): boolean {
  return (countArgs.mock.calls.at(-1)![1] as ComputedRef<boolean>).value
}

describe('useCampaignHomebrewSync', () => {
  beforeEach(() => {
    createHomebrew.mockReset().mockResolvedValue(12)
    updateHomebrew.mockReset().mockResolvedValue(undefined)
    countArgs.mockReset()
    onError.mockReset()
    count.value = 0
  })

  describe('create', () => {
    it('Should create the homebrew in the campaign and return its id', async () => {
      expect(await setup().create(data)).toBe(12)
      expect(createHomebrew).toHaveBeenCalledWith({
        data: { ...data, campaign: 4 },
        onError,
      })
    })

    it('Should not create without a campaign', async () => {
      expect(await setup({ campaignId: undefined }).create(data)).toBeNull()
      expect(createHomebrew).not.toHaveBeenCalled()
    })

    it('Should return null when creating fails', async () => {
      createHomebrew.mockRejectedValue(new Error('nope'))

      expect(await setup().create(data)).toBeNull()
    })
  })

  describe('update', () => {
    it('Should update the homebrew by id', async () => {
      expect(await setup().update(7, data)).toBe(true)
      expect(updateHomebrew).toHaveBeenCalledWith({ data, id: 7, onError })
    })

    it('Should return false when updating fails', async () => {
      updateHomebrew.mockRejectedValue(new Error('nope'))

      expect(await setup().update(7, data)).toBe(false)
    })
  })

  describe('sync', () => {
    it('Should create a homebrew when nothing is linked yet', async () => {
      expect(await setup().sync(data)).toBe(12)
      expect(updateHomebrew).not.toHaveBeenCalled()
    })

    it('Should update the linked homebrew and keep the link', async () => {
      expect(await setup({ linkedId: 7 }).sync(data)).toBe(7)
      expect(updateHomebrew).toHaveBeenCalledWith({ data, id: 7, onError })
      expect(createHomebrew).not.toHaveBeenCalled()
    })

    it('Should return null when updating the linked homebrew fails', async () => {
      updateHomebrew.mockRejectedValue(new Error('nope'))

      expect(await setup({ linkedId: 7 }).sync(data)).toBeNull()
    })

    it('Should keep the current link without a campaign', async () => {
      const sync = setup({ campaignId: undefined, linkedId: 7 }).sync

      expect(await sync(data)).toBe(7)
      expect(createHomebrew).not.toHaveBeenCalled()
      expect(updateHomebrew).not.toHaveBeenCalled()
    })
  })

  describe('isLinked', () => {
    it('Should tell whether a homebrew is linked', () => {
      expect(setup().isLinked).toBe(false)
      expect(setup({ linkedId: 7 }).isLinked).toBe(true)
    })
  })

  describe('isFull', () => {
    it('Should not be full below the maximum', () => {
      count.value = maxCampaignHomebrews - 1

      expect(setup().isFull.value).toBe(false)
    })

    it('Should be full at the maximum', () => {
      count.value = maxCampaignHomebrews

      expect(setup().isFull.value).toBe(true)
    })

    it('Should never be full for a linked homebrew', () => {
      count.value = maxCampaignHomebrews

      expect(setup({ linkedId: 7 }).isFull.value).toBe(false)
    })

    it('Should not be full before the count has loaded', () => {
      count.value = undefined

      expect(setup().isFull.value).toBe(false)
    })
  })

  describe('count query', () => {
    it('Should count the homebrews of the campaign', () => {
      setup()

      expect(countArgs.mock.calls.at(-1)![0]).toBe(4)
      expect(countEnabled()).toBe(true)
    })

    it('Should not count without a campaign', () => {
      setup({ campaignId: undefined })

      expect(countEnabled()).toBe(false)
    })

    it('Should not count for a linked homebrew', () => {
      setup({ linkedId: 7 })

      expect(countEnabled()).toBe(false)
    })

    it('Should follow the enabled getter', () => {
      const enabled = ref(false)

      setup({ countEnabled: () => enabled.value })

      expect(countEnabled()).toBe(false)

      enabled.value = true

      expect(countEnabled()).toBe(true)
    })
  })
})
