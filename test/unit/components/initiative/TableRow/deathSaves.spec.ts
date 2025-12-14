import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import DeathSaves from '~/components/initiative/TableRow/DeathSaves'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet } from '~~/test/unit/fixtures/initiative-sheet'

interface Props {
  item: InitiativeSheetRow
}

const mockUpdate = vi.fn()
const mockToast = vi.fn()
const mockSheet = ref<InitiativeSheet>(sheet)

vi.mock('~/components/ui/toast/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

const provide = {
  [INITIATIVE_SHEET]: {
    sheet: mockSheet,
    update: mockUpdate,
  },
}

const props: Props = {
  item: sheet.rows[0]!,
}

describe('Initiative table row death saves', async () => {
  beforeEach(() => {
    mockUpdate.mockClear()
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

    expect(component.find('[data-test-container]').exists()).toBeFalsy()
  })

  it('Should not render for summon type', async () => {
    const component = await mountSuspended(DeathSaves, {
      props: {
        item: { ...props.item, type: 'summon' },
      },
      provide,
    })

    expect(component.find('[data-test-container]').exists()).toBeFalsy()
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

    expect(component.find('[data-test-container]').exists()).toBeTruthy()
  })

  it('Should render 3 save and 3 fail buttons', async () => {
    const component = await mountSuspended(DeathSaves, { props, provide })

    expect(component.findAll('[data-test-button="save"]').length).toBe(3)
    expect(component.findAll('[data-test-button="fail"]').length).toBe(3)
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

    expect(component.find('[data-test-container]').classes()).toContain('bg-success/20')
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

    expect(component.find('[data-test-container]').classes()).toContain('bg-destructive/20')
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
    mockSheet.value = undefined as any

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

    const buttons = component.findAll('[data-test-button]')
    await buttons[0]!.trigger('click')

    expect(mockUpdate).not.toHaveBeenCalled()
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

    const buttons = component.findAll('[data-test-button="save"]')
    await buttons[1]!.trigger('click')

    expect(mockToast).not.toHaveBeenCalled()
  })
})
