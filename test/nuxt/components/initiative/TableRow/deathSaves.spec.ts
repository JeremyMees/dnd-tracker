import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import DeathSaves from '~/components/initiative/TableRow/DeathSaves.vue'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet } from '~~/test/fixtures/initiative-sheet'

interface Props {
  item: InitiativeSheetRow
}

interface DeathSavesTestMethods {
  updateDeathSave: (saveIndex: number, save: boolean) => void
}

const mockPatchRow = vi.fn()
const mockToast = vi.fn()
const mockSheet = ref<InitiativeSheet | undefined>(sheet)

vi.mock('~/components/ui/toast/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

const provide = {
  [INITIATIVE_SHEET]: {
    sheet: mockSheet,
    patchRow: mockPatchRow,
  },
}

const props: Props = {
  item: sheet.rows[0]!,
}

describe('Initiative table row death saves', async () => {
  beforeEach(() => {
    mockPatchRow.mockClear()
    mockToast.mockClear()
    mockSheet.value = sheet
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(DeathSaves, { props, provide })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should not render for lair type', async () => {
    const component = await mountSuspended(DeathSaves, {
      props: {
        item: { ...props.item, type: 'lair' },
      },
      provide,
    })

    expect(component.find('[test-id="container"]').exists()).toBeFalsy()
  })

  it('Should not render for summon type', async () => {
    const component = await mountSuspended(DeathSaves, {
      props: {
        item: { ...props.item, type: 'summon' },
      },
      provide,
    })

    expect(component.find('[test-id="container"]').exists()).toBeFalsy()
  })

  it('Should render for player type', async () => {
    const component = await mountSuspended(DeathSaves, {
      props: {
        item: {
          ...props.item,
          type: 'player',
          deathSaves: {
            save: [false, false, false],
            fail: [false, false, false],
          },
        },
      },
      provide,
    })

    expect(component.find('[test-id="container"]').exists()).toBeTruthy()
  })

  it('Should render 3 save and 3 fail buttons', async () => {
    const component = await mountSuspended(DeathSaves, { props, provide })

    expect(component.findAll('[test-id="save"]').length).toBe(3)
    expect(component.findAll('[test-id="fail"]').length).toBe(3)
  })

  it('Should show success styling when all saves are successful', async () => {
    const component = await mountSuspended(DeathSaves, {
      props: {
        item: {
          ...props.item,
          type: 'player',
          deathSaves: {
            save: [true, true, true],
            fail: [false, false, false],
          },
        },
      },
      provide,
    })

    expect(component.find('[test-id="container"]').classes()).toContain(
      'bg-success/20',
    )
  })

  it('Should show destructive styling when all saves are failed', async () => {
    const component = await mountSuspended(DeathSaves, {
      props: {
        item: {
          ...props.item,
          type: 'player',
          deathSaves: {
            save: [false, false, false],
            fail: [true, true, true],
          },
        },
      },
      provide,
    })

    expect(component.find('[test-id="container"]').classes()).toContain(
      'bg-destructive/20',
    )
  })

  it('Should toggle save state when clicking a save button', async () => {
    const component = await mountSuspended(DeathSaves, {
      props: {
        item: {
          ...props.item,
          type: 'player',
          deathSaves: {
            save: [false, false, false],
            fail: [false, false, false],
          },
        },
      },
      provide,
    })

    const buttons = component.findAll('[test-id="save"]')
    await buttons[0]!.trigger('click')

    expect(mockPatchRow).toHaveBeenCalledWith(props.item.id, {
      deathSaves: {
        save: [true, false, false],
        fail: [false, false, false],
      },
    })
  })

  it('Should toggle fail state when clicking a fail button', async () => {
    const component = await mountSuspended(DeathSaves, {
      props: {
        item: {
          ...props.item,
          type: 'player',
          deathSaves: {
            save: [false, false, false],
            fail: [false, false, false],
          },
        },
      },
      provide,
    })

    const buttons = component.findAll('[test-id="fail"]')
    await buttons[0]!.trigger('click')

    expect(mockPatchRow).toHaveBeenCalledWith(props.item.id, {
      deathSaves: {
        save: [false, false, false],
        fail: [true, false, false],
      },
    })
  })

  it('Should not call patchRow when the item has no death saves', async () => {
    const component = await mountSuspended(DeathSaves, {
      props: {
        item: {
          ...props.item,
          type: 'player',
          deathSaves: undefined,
        },
      },
      provide,
    })

    const vm = component.vm as unknown as DeathSavesTestMethods
    vm.updateDeathSave(0, true)

    expect(mockPatchRow).not.toHaveBeenCalled()
  })

  it('Should show stable toast when all saves are successful', async () => {
    const component = await mountSuspended(DeathSaves, {
      props: {
        item: {
          ...props.item,
          type: 'player',
          deathSaves: {
            save: [true, true, false],
            fail: [false, false, false],
          },
        },
      },
      provide,
    })

    const buttons = component.findAll('[test-id="save"]')
    await buttons[2]!.trigger('click')

    expect(mockToast).toHaveBeenCalledWith({
      title: expect.stringMatching('components.initiativeTable.stable.title'),
      description: expect.stringMatching(
        'components.initiativeTable.stable.textDeathSaves',
      ),
      variant: 'success',
    })
  })

  it('Should show died toast when all fails are triggered', async () => {
    const component = await mountSuspended(DeathSaves, {
      props: {
        item: {
          ...props.item,
          type: 'player',
          deathSaves: {
            save: [false, false, false],
            fail: [true, true, false],
          },
        },
      },
      provide,
    })

    const buttons = component.findAll('[test-id="fail"]')
    await buttons[2]!.trigger('click')

    expect(mockToast).toHaveBeenCalledWith({
      title: expect.stringMatching('components.initiativeTable.died.title'),
      description: expect.stringMatching(
        'components.initiativeTable.died.textDeathSaves',
      ),
      variant: 'destructive',
    })
  })

  it('Should not show toast when saves/fails are not complete', async () => {
    const component = await mountSuspended(DeathSaves, {
      props: {
        item: {
          ...props.item,
          type: 'player',
          deathSaves: {
            save: [true, false, false],
            fail: [false, false, false],
          },
        },
      },
      provide,
    })

    const buttons = component.findAll('[test-id="save"]')
    await buttons[1]!.trigger('click')

    expect(mockToast).not.toHaveBeenCalled()
  })
})
