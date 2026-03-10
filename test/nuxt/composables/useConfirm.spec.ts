import { beforeEach, describe, expect, it, vi } from 'vitest'
import mockConfirm from '../fixtures/confirm.json'
import { useConfirmDialogs, useConfirm } from '~/composables/useConfirm'

describe('useConfirm', async () => {
  let confirmDialogs: ReturnType<typeof useConfirmDialogs>
  let confirm: ReturnType<typeof useConfirm>

  const mockCallback = vi.fn()

  beforeEach(() => {
    clearNuxtState()
    confirmDialogs = useConfirmDialogs()
    confirm = useConfirm()
    mockCallback.mockReset()
  })

  it('Should add a confirm dialog to the array', async () => {
    confirm.ask(mockConfirm, mockCallback)

    expect(confirmDialogs.dialogs.value.length).toBe(1)
  })

  it('Should call the callback with true when confirmed', async () => {
    confirm.ask(mockConfirm, mockCallback)

    const uuid = confirmDialogs.dialogs.value[0]?.uuid
    if (!uuid) throw new Error('Dialog was not created')

    await confirmDialogs.handlers.confirm(uuid)

    expect(mockCallback).toHaveBeenCalledWith(true)
    expect(confirmDialogs.dialogs.value.length).toBe(0)
  })

  it('Should call the callback with false when declined', async () => {
    confirm.ask(mockConfirm, mockCallback)

    const uuid = confirmDialogs.dialogs.value[0]?.uuid
    if (!uuid) throw new Error('Dialog was not created')

    await confirmDialogs.handlers.decline(uuid)

    expect(mockCallback).toHaveBeenCalledWith(false)
    expect(confirmDialogs.dialogs.value.length).toBe(0)
  })

  it('Should set loading to true during confirmation process', async () => {
    confirm.ask(mockConfirm, mockCallback)

    const uuid = confirmDialogs.dialogs.value[0]?.uuid
    if (!uuid) throw new Error('Dialog was not created')

    let resolveCallback: (value: unknown) => void = () => { }

    mockCallback.mockImplementation(() => new Promise((resolve) => {
      resolveCallback = resolve
    }))

    const confirmPromise = confirmDialogs.handlers.confirm(uuid)

    expect(confirmDialogs.dialogs.value[0]?.loading).toBe(true)

    resolveCallback(undefined)

    await confirmPromise

    expect(confirmDialogs.dialogs.value.length).toBe(0)
  })

  it('Should handle errors during confirmation and set loading back to false', async () => {
    confirm.ask(mockConfirm, mockCallback)

    const uuid = confirmDialogs.dialogs.value[0]?.uuid
    if (!uuid) throw new Error('Dialog was not created')

    mockCallback.mockRejectedValue(new Error('Test error'))

    await confirmDialogs.handlers.confirm(uuid)

    expect(mockCallback).toHaveBeenCalledWith(true)
    expect(confirmDialogs.dialogs.value.length).toBe(1)
    expect(confirmDialogs.dialogs.value[0]?.loading).toBe(false)
  })
})
