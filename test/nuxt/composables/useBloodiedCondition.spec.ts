import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useBloodiedCondition } from '~/composables/useBloodiedCondition'
import conditions from '~~/test/fixtures/conditions.json'
import { bloodiedCondition } from '~~/test/fixtures/bloodied-condition'

const mockConditions = ref<DndCondition[] | undefined>()

vi.mock('~/queries/srd', () => ({
  useConditionsListing: () => ({ data: mockConditions }),
}))

const settings: InitiativeSettings = { spacing: 'normal', modified: false }

describe('useBloodiedCondition', () => {
  beforeEach(() => {
    mockConditions.value = [...conditions, bloodiedCondition]
  })

  it('finds the bloodied condition in the conditions listing', () => {
    expect(useBloodiedCondition(settings).value).toEqual(bloodiedCondition)
  })

  it('is undefined when the sheet has automatic bloodied switched off', () => {
    expect(
      useBloodiedCondition({ ...settings, bloodied: false }).value,
    ).toBeUndefined()
  })

  it('is undefined when the listing has no bloodied condition', () => {
    mockConditions.value = conditions

    expect(useBloodiedCondition(settings).value).toBeUndefined()
  })

  it('is undefined while the listing is still loading', () => {
    mockConditions.value = undefined

    expect(useBloodiedCondition(settings).value).toBeUndefined()
  })

  it('follows changes to the settings', () => {
    const current = ref<InitiativeSettings | undefined>(settings)
    const bloodied = useBloodiedCondition(current)

    expect(bloodied.value).toEqual(bloodiedCondition)

    current.value = { ...settings, bloodied: false }

    expect(bloodied.value).toBeUndefined()
  })
})
