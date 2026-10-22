import { expectNoToast, toast } from '~~/test/nuxt/stubs/toast'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import DeathSaves from '~/components/initiative/TableRow/DeathSaves.vue'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet } from '~~/test/fixtures/initiative-sheet'

interface Props {
  item: InitiativeSheetRow
}

const mockPatchRow = vi.fn()
const mockSheet = ref<InitiativeSheet | undefined>(sheet)

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
    mockSheet.value = sheet
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(DeathSaves, { props, provide })

    expect(component.html()).toMatchSnapshot()
  })

  it.each<InitiativeSheetRow['type']>(['lair', 'summon', 'monster'])(
    'Should not render for %s type',
    async type => {
      const component = await mountSuspended(DeathSaves, {
        props: {
          item: { ...props.item, type },
        },
        provide,
      })

      expect(component.find('[test-id="container"]').exists()).toBeFalsy()
    },
  )

  it.each<InitiativeSheetRow['type']>(['npc', 'player'])(
    'Should render for %s type',
    async type => {
      const component = await mountSuspended(DeathSaves, {
        props: {
          item: { ...props.item, type },
        },
        provide,
      })

      expect(component.find('[test-id="container"]').exists()).toBeTruthy()
    },
  )

  it('Should render 3 save and 3 fail buttons', async () => {
    const component = await mountSuspended(DeathSaves, { props, provide })

    expect(component.findAll('[test-id="save"] [test-id="pip"]').length).toBe(3)
    expect(component.findAll('[test-id="fail"] [test-id="pip"]').length).toBe(3)
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

    const buttons = component.findAll('[test-id="save"] [test-id="pip"]')
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

    const buttons = component.findAll('[test-id="fail"] [test-id="pip"]')
    await buttons[0]!.trigger('click')

    expect(mockPatchRow).toHaveBeenCalledWith(props.item.id, {
      deathSaves: {
        save: [false, false, false],
        fail: [true, false, false],
      },
    })
  })

  it('Should start from empty death saves when the item has none', async () => {
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

    await component
      .findAll('[test-id="fail"] [test-id="pip"]')[1]!
      .trigger('click')

    expect(mockPatchRow).toHaveBeenCalledWith(props.item.id, {
      deathSaves: {
        save: [false, false, false],
        fail: [true, true, false],
      },
    })
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

    const buttons = component.findAll('[test-id="save"] [test-id="pip"]')
    await buttons[2]!.trigger('click')

    expect(toast.success).toHaveBeenCalledWith(
      expect.stringMatching('components.initiativeTable.stable.title'),
      {
        description: expect.stringMatching(
          'components.initiativeTable.stable.textDeathSaves',
        ),
      },
    )
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

    const buttons = component.findAll('[test-id="fail"] [test-id="pip"]')
    await buttons[2]!.trigger('click')

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringMatching('components.initiativeTable.died.title'),
      {
        description: expect.stringMatching(
          'components.initiativeTable.died.textDeathSaves',
        ),
      },
    )
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

    const buttons = component.findAll('[test-id="save"] [test-id="pip"]')
    await buttons[1]!.trigger('click')

    expectNoToast()
  })
})
