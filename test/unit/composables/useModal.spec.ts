import { beforeEach, describe, expect, it } from 'vitest'
import mockModal from '../fixtures/modal.json'
import { useModal } from '~/composables/useModal'

describe('useModal', async () => {
  beforeEach(() => clearNuxtState())

  it('Should add a modal to the array', async () => {
    const modal = useModal()

    modal.open(mockModal as Modal)

    expect(modal.modals.value.length).toBe(1)
  })

  it('Should not add a modal to the array if it already exists', async () => {
    const modal = useModal()

    modal.open(mockModal as Modal)
    modal.open(mockModal as Modal)

    expect(modal.modals.value.length).toBe(1)
  })

  it('Should close a modal', async () => {
    const modal = useModal()

    const uuid = modal.open(mockModal as Modal)

    expect(modal.modals.value.length).toBe(1)

    modal.close(uuid)

    expect(modal.modals.value.length).toBe(0)
  })

  it('Should not close a modal if it does not exist', async () => {
    const modal = useModal()

    modal.open(mockModal as Modal)
    modal.close('123')

    expect(modal.modals.value.length).toBe(1)
  })
})
