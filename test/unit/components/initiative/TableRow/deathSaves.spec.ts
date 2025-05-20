import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import DeathSaves from '~/components/initiative/TableRow/DeathSaves.vue'
import { sheet } from '~~/test/unit/fixtures/initiative-sheet'

interface Props {
  item: InitiativeSheetRow
  sheet: InitiativeSheet | undefined
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>) => Promise<void>
}

const mockUpdate = vi.fn()
const mockToast = vi.fn()

vi.mock('~/components/ui/toast/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

const props: Props = {
  item: sheet.rows[0]!,
  sheet,
  update: mockUpdate,
}

describe('Initiative table row death saves', async () => {
  beforeEach(() => {
    mockUpdate.mockClear()
    mockToast.mockClear()
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(DeathSaves, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should not render for lair type', async () => {
    const component = await mountSuspended(DeathSaves, {
      props: {
        ...props,
        item: { ...props.item, type: 'lair' },
      },
    })

    expect(component.find('[data-test-container]').exists()).toBeFalsy()
  })

  it('Should not render for summon type', async () => {
    const component = await mountSuspended(DeathSaves, {
      props: {
        ...props,
        item: { ...props.item, type: 'summon' },
      },
    })

    expect(component.find('[data-test-container]').exists()).toBeFalsy()
  })

  it('Should render for player type', async () => {
    const component = await mountSuspended(DeathSaves, {
      props: {
        ...props,
        item: {
          ...props.item,
          type: 'player',
          deathSaves: {
            save: [false, false, false],
            fail: [false, false, false],
          },
        },
      },
    })

    expect(component.find('[data-test-container]').exists()).toBeTruthy()
  })

  it('Should render 3 save and 3 fail buttons', async () => {
    const component = await mountSuspended(DeathSaves, { props })

    expect(component.findAll('[data-test-button="save"]').length).toBe(3)
    expect(component.findAll('[data-test-button="fail"]').length).toBe(3)
  })

  it('Should show success styling when all saves are successful', async () => {
    const component = await mountSuspended(DeathSaves, {
      props: {
        ...props,
        item: {
          ...props.item,
          type: 'player',
          deathSaves: {
            save: [true, true, true],
            fail: [false, false, false],
          },
        },
      },
    })

    expect(component.find('[data-test-container]').classes()).toContain('bg-success/20')
  })

  it('Should show destructive styling when all saves are failed', async () => {
    const component = await mountSuspended(DeathSaves, {
      props: {
        ...props,
        item: {
          ...props.item,
          type: 'player',
          deathSaves: {
            save: [false, false, false],
            fail: [true, true, true],
          },
        },
      },
    })

    expect(component.find('[data-test-container]').classes()).toContain('bg-destructive/20')
  })

  it('Should toggle save state when clicking a save button', async () => {
    const component = await mountSuspended(DeathSaves, {
      props: {
        ...props,
        item: {
          ...props.item,
          type: 'player',
          deathSaves: {
            save: [false, false, false],
            fail: [false, false, false],
          },
        },
      },
    })

    const buttons = component.findAll('[data-test-button="save"]')
    await buttons[0]!.trigger('click')

    expect(mockUpdate).toHaveBeenCalledWith({
      rows: expect.arrayContaining([
        expect.objectContaining({
          deathSaves: {
            save: [true, false, false],
            fail: [false, false, false],
          },
        }),
      ]),
    })
  })

  it('Should toggle fail state when clicking a fail button', async () => {
    const component = await mountSuspended(DeathSaves, {
      props: {
        ...props,
        item: {
          ...props.item,
          type: 'player',
          deathSaves: {
            save: [false, false, false],
            fail: [false, false, false],
          },
        },
      },
    })

    const buttons = component.findAll('[data-test-button="fail"]')
    await buttons[0]!.trigger('click')

    expect(mockUpdate).toHaveBeenCalledWith({
      rows: expect.arrayContaining([
        expect.objectContaining({
          deathSaves: {
            save: [false, false, false],
            fail: [true, false, false],
          },
        }),
      ]),
    })
  })

  it('Should not call update when sheet is undefined', async () => {
    const component = await mountSuspended(DeathSaves, {
      props: {
        ...props,
        sheet: undefined,
        item: {
          ...props.item,
          type: 'player',
          deathSaves: {
            save: [false, false, false],
            fail: [false, false, false],
          },
        },
      },
    })

    const buttons = component.findAll('[data-test-button]')
    await buttons[0]!.trigger('click')

    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('Should show stable toast when all saves are successful', async () => {
    const component = await mountSuspended(DeathSaves, {
      props: {
        ...props,
        item: {
          ...props.item,
          type: 'player',
          deathSaves: {
            save: [true, true, false],
            fail: [false, false, false],
          },
        },
      },
    })

    const buttons = component.findAll('[data-test-button="save"]')
    await buttons[2]!.trigger('click')

    expect(mockToast).toHaveBeenCalledWith({
      title: expect.stringMatching('components.initiativeTable.stable.title'),
      description: expect.stringMatching('components.initiativeTable.stable.textDeathSaves'),
      variant: 'success',
    })
  })

  it('Should show died toast when all fails are triggered', async () => {
    const component = await mountSuspended(DeathSaves, {
      props: {
        ...props,
        item: {
          ...props.item,
          type: 'player',
          deathSaves: {
            save: [false, false, false],
            fail: [true, true, false],
          },
        },
      },
    })

    const buttons = component.findAll('[data-test-button="fail"]')
    await buttons[2]!.trigger('click')

    expect(mockToast).toHaveBeenCalledWith({
      title: expect.stringMatching('components.initiativeTable.died.title'),
      description: expect.stringMatching('components.initiativeTable.died.textDeathSaves'),
      variant: 'destructive',
    })
  })

  it('Should not show toast when saves/fails are not complete', async () => {
    const component = await mountSuspended(DeathSaves, {
      props: {
        ...props,
        item: {
          ...props.item,
          type: 'player',
          deathSaves: {
            save: [true, false, false],
            fail: [false, false, false],
          },
        },
      },
    })

    const buttons = component.findAll('[data-test-button="save"]')
    await buttons[1]!.trigger('click')

    expect(mockToast).not.toHaveBeenCalled()
  })
})
