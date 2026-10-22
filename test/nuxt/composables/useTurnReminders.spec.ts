import { expectNoToast, resetToast, toast } from '~~/test/nuxt/stubs/toast'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTurnReminders } from '~/composables/useTurnReminders'
import { mountHook } from '~~/test/nuxt/stubs/query-client'

const held: DndCondition = {
  id: 'paralyzed',
  name: 'Paralyzed',
  desc: 'Cannot move.',
  duration: {
    rowId: 'row-1',
    timing: 'end',
    save: { ability: 'wisdom', dc: 13 },
  },
}

const prone: DndCondition = { id: 'prone', name: 'Prone', desc: 'Down.' }

const goblin: InitiativeSheetRow = {
  id: 'row-1',
  index: 0,
  initiative: 12,
  name: 'Goblin',
  type: 'monster',
  conditions: [held, prone],
}

const saveReminder: TurnReminder = {
  rowId: 'row-1',
  rowName: 'Goblin',
  condition: held,
}

const expiredReminder: TurnReminder = {
  rowId: 'row-1',
  rowName: 'Goblin',
  condition: prone,
}

const recharge: RechargeReminder = {
  rowId: 'row-1',
  rowName: 'Goblin',
  action: 'Fire Breath',
  roll: 3,
  recharged: false,
}

const patchRow = vi.fn().mockResolvedValue(undefined)
const sheet = ref<InitiativeSheet | undefined>()

interface ToastOptions {
  duration?: number
  action: { label: string; onClick: () => void }
  cancel: { label: string; onClick: () => void }
}

async function showReminders(reminders: TurnReminders) {
  const { vm } = await mountHook(() => ({
    show: useTurnReminders(sheet, patchRow),
  }))

  vm.show(reminders)

  return vm
}

function saveToastOptions(): ToastOptions {
  return toast.warning.mock.calls[0]![1] as ToastOptions
}

describe('useTurnReminders', () => {
  beforeEach(() => {
    resetToast()
    patchRow.mockClear()
    sheet.value = {
      rows: [goblin],
      infoCards: [prone],
    } as unknown as InitiativeSheet
  })

  it('Should show nothing without reminders', async () => {
    await showReminders({ expired: [], saves: [], recharges: [] })

    expectNoToast()
  })

  it('Should keep a save reminder open with saved and failed buttons', async () => {
    await showReminders({ expired: [], saves: [saveReminder], recharges: [] })

    expect(toast.warning).toHaveBeenCalledWith(
      'components.turnReminders.save',
      expect.objectContaining({
        duration: Infinity,
        action: expect.objectContaining({
          label: 'components.turnReminders.saved',
        }),
        cancel: expect.objectContaining({
          label: 'components.turnReminders.failed',
        }),
      }),
    )
  })

  it('Should only remove the saved condition from the row', async () => {
    await showReminders({ expired: [], saves: [saveReminder], recharges: [] })

    saveToastOptions().action.onClick()

    expect(patchRow).toHaveBeenCalledWith('row-1', { conditions: [prone] })
    expect(sheet.value?.infoCards).toEqual([prone])
  })

  it('Should leave the row alone when the save fails', async () => {
    await showReminders({ expired: [], saves: [saveReminder], recharges: [] })

    saveToastOptions().cancel.onClick()

    expect(patchRow).not.toHaveBeenCalled()
  })

  it('Should leave the row alone when it is gone', async () => {
    sheet.value = { rows: [], infoCards: [] } as unknown as InitiativeSheet

    await showReminders({ expired: [], saves: [saveReminder], recharges: [] })

    saveToastOptions().action.onClick()

    expect(patchRow).not.toHaveBeenCalled()
  })

  it('Should announce an expired condition', async () => {
    await showReminders({
      expired: [expiredReminder],
      saves: [],
      recharges: [],
    })

    expect(toast.info).toHaveBeenCalledWith('components.turnReminders.expired')
  })

  it('Should announce a recharged action', async () => {
    await showReminders({
      expired: [],
      saves: [],
      recharges: [{ ...recharge, recharged: true }],
    })

    expect(toast.success).toHaveBeenCalledWith(
      'components.turnReminders.recharged',
    )
  })

  it('Should announce an action that did not recharge', async () => {
    await showReminders({ expired: [], saves: [], recharges: [recharge] })

    expect(toast.info).toHaveBeenCalledWith(
      'components.turnReminders.notRecharged',
    )
  })

  it('Should treat a broadcast without recharges as none', async () => {
    await showReminders({ expired: [], saves: [] } as unknown as TurnReminders)

    expectNoToast()
  })

  it('Should dismiss the previous turn reminders when new ones arrive', async () => {
    toast.warning.mockReturnValueOnce('save-toast')
    toast.info.mockReturnValueOnce('expired-toast')

    const vm = await showReminders({
      expired: [expiredReminder],
      saves: [saveReminder],
      recharges: [],
    })

    vm.show({ expired: [], saves: [], recharges: [] })

    expect(toast.dismiss).toHaveBeenCalledWith('save-toast')
    expect(toast.dismiss).toHaveBeenCalledWith('expired-toast')
  })
})
