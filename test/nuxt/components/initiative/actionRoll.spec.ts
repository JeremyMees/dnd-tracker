import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ActionRoll from '~/components/initiative/ActionRoll.vue'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { closePopover, openPopover } from '~~/test/nuxt/stubs/popover'

type RollType = 'advantage' | 'straight' | 'disadvantage'

interface RollResult {
  attackRoll: number
  attackTotal: number
  rolledToHit: number[]
  damageRolled: Record<number, number[]>
  totalDamage: number
  rollType: RollType
}

interface ActionRollVM {
  targets: { label: string; value: string }[]
  result: RollResult | undefined
  popoverOpen: boolean
  formError: string
  onRoll: (type: RollType) => void
  onSubmit: () => Promise<void>
  form: { setFieldValue: (field: string, value: unknown) => void }
}

const mockUpdate = vi.fn()
const mockToast = vi.fn()
const mockSheet = ref<InitiativeSheet | undefined>(sheet)
const mockActiveRow = ref<InitiativeSheetRow | undefined>()

vi.mock('~/components/ui/toast/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

const provide = {
  [INITIATIVE_SHEET]: {
    sheet: mockSheet,
    update: mockUpdate,
    activeRow: mockActiveRow,
  },
}

const props = {
  attackBonus: 5,
  damageDice: '2d6',
  damageBonus: 3,
  id: sheet.rows[0]!.id,
}

let component: VueWrapper<InstanceType<typeof ActionRoll>>

describe('ActionRoll component', () => {
  beforeEach(() => {
    mockUpdate.mockClear()
    mockToast.mockClear()
    mockSheet.value = sheet
  })

  it('Should match snapshot', async () => {
    component = await mountSuspended(ActionRoll, { props, provide })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should have result undefined and popoverOpen false initially', async () => {
    component = await mountSuspended(ActionRoll, { props, provide })

    const vm = component.vm as unknown as ActionRollVM
    expect(vm.result).toBeUndefined()
    expect(vm.popoverOpen).toBeFalsy()
  })

  describe('Roll functionality', () => {
    it('Should roll straight with single die', async () => {
      component = await mountSuspended(ActionRoll, { props, provide })

      const vm = component.vm as unknown as ActionRollVM
      vm.onRoll('straight')
      await nextTick()

      expect(vm.result).toBeDefined()
      expect(vm.result?.rollType).toBe('straight')
      expect(vm.result?.rolledToHit.length).toBe(1)
    })

    it('Should roll advantage with two dice and take highest', async () => {
      component = await mountSuspended(ActionRoll, { props, provide })

      const vm = component.vm as unknown as ActionRollVM
      vm.onRoll('advantage')
      await nextTick()

      expect(vm.result).toBeDefined()
      expect(vm.result?.rollType).toBe('advantage')
      expect(vm.result?.rolledToHit.length).toBe(2)
      expect(vm.result?.attackRoll).toBe(Math.max(...vm.result!.rolledToHit))
    })

    it('Should roll disadvantage with two dice and take lowest', async () => {
      component = await mountSuspended(ActionRoll, { props, provide })

      const vm = component.vm as unknown as ActionRollVM
      vm.onRoll('disadvantage')
      await nextTick()

      expect(vm.result).toBeDefined()
      expect(vm.result?.rollType).toBe('disadvantage')
      expect(vm.result?.rolledToHit.length).toBe(2)
      expect(vm.result?.attackRoll).toBe(Math.min(...vm.result!.rolledToHit))
    })

    it('Should calculate attackTotal with attackBonus and totalDamage with damageBonus', async () => {
      component = await mountSuspended(ActionRoll, { props, provide })

      const vm = component.vm as unknown as ActionRollVM
      vm.onRoll('straight')
      await nextTick()

      const baseDamage = Object.values(vm.result!.damageRolled)
        .flat()
        .reduce((acc, curr) => acc + curr, 0)

      expect(vm.result).toBeDefined()
      expect(vm.result?.attackTotal).toBe(
        vm.result!.attackRoll + props.attackBonus!,
      )
      expect(vm.result?.totalDamage).toBe(baseDamage + props.damageBonus)
    })

    it('Should handle undefined attackBonus', async () => {
      component = await mountSuspended(ActionRoll, {
        props: { ...props, attackBonus: undefined },
        provide,
      })

      const vm = component.vm as unknown as ActionRollVM
      vm.onRoll('straight')
      await nextTick()

      expect(vm.result).toBeDefined()
      expect(vm.result?.attackTotal).toBe(vm.result?.attackRoll)
    })

    it('Should handle undefined damageDice', async () => {
      component = await mountSuspended(ActionRoll, {
        props: { ...props, damageDice: undefined },
        provide,
      })

      const vm = component.vm as unknown as ActionRollVM
      vm.onRoll('straight')
      await nextTick()

      expect(vm.result).toBeDefined()
      expect(vm.result?.totalDamage).toBe(props.damageBonus)
    })

    it('Should handle zero damageBonus', async () => {
      component = await mountSuspended(ActionRoll, {
        props: { ...props, damageBonus: 0 },
        provide,
      })

      const vm = component.vm as unknown as ActionRollVM
      vm.onRoll('straight')
      await nextTick()

      const baseDamage = Object.values(vm.result!.damageRolled)
        .flat()
        .reduce((acc, curr) => acc + curr, 0)

      expect(vm.result).toBeDefined()
      expect(vm.result?.totalDamage).toBe(baseDamage)
    })
  })

  describe('Target selection', () => {
    it('Should filter out current row and include all other rows as targets', async () => {
      component = await mountSuspended(ActionRoll, { props, provide })

      const vm = component.vm as unknown as ActionRollVM
      const targets = vm.targets

      expect(targets.find(t => t.value === props.id)).toBeUndefined()
      expect(targets.length).toBe(sheet.rows.length - 1)

      const otherRows = sheet.rows.filter(row => row.id !== props.id)
      otherRows.forEach(row => {
        expect(targets.find(t => t.value === row.id)).toBeDefined()
        expect(targets.find(t => t.label === row.name)).toBeDefined()
      })
    })

    it('Should have no targets when sheet has only current row or empty rows', async () => {
      mockSheet.value = { ...sheet, rows: [sheet.rows[0]!] }
      const component1 = await mountSuspended(ActionRoll, { props, provide })
      expect((component1.vm as unknown as ActionRollVM).targets?.length).toBe(0)

      mockSheet.value = { ...sheet, rows: [] }
      const component2 = await mountSuspended(ActionRoll, { props, provide })
      expect((component2.vm as unknown as ActionRollVM).targets?.length).toBe(0)
    })

    it('Should not call update when sheet is undefined', async () => {
      mockSheet.value = undefined

      component = await mountSuspended(ActionRoll, { props, provide })

      const vm = component.vm as unknown as ActionRollVM
      await vm.onSubmit()

      expect(mockUpdate).not.toHaveBeenCalled()
    })
  })

  describe('Critical hits', () => {
    it('Should double the damage dice rolled on a natural 20', async () => {
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99)
      component = await mountSuspended(ActionRoll, { props, provide })

      const vm = component.vm as unknown as ActionRollVM
      vm.onRoll('straight')
      await nextTick()

      expect(vm.result?.attackRoll).toBe(20)
      expect(vm.result?.damageRolled[6]?.length).toBe(4)

      randomSpy.mockRestore()
    })

    it('Should not double the damage dice when the attack roll is not a natural 20', async () => {
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0)
      component = await mountSuspended(ActionRoll, { props, provide })

      const vm = component.vm as unknown as ActionRollVM
      vm.onRoll('straight')
      await nextTick()

      expect(vm.result?.attackRoll).toBe(1)
      expect(vm.result?.damageRolled[6]?.length).toBe(2)

      randomSpy.mockRestore()
    })
  })

  describe('Popover interactions', () => {
    it('Should render the title and roll buttons once opened', async () => {
      component = await mountSuspended(ActionRoll, { props, provide })

      await openPopover(component)

      expect(document.body.querySelector('[test-id="advantage"]')).toBeTruthy()
      expect(document.body.querySelector('[test-id="straight"]')).toBeTruthy()
      expect(
        document.body.querySelector('[test-id="disadvantage"]'),
      ).toBeTruthy()
      expect(document.body.textContent).toContain('actions.roll')
    })

    it('Should reset the roll result when the popover is closed', async () => {
      component = await mountSuspended(ActionRoll, { props, provide })
      const vm = component.vm as unknown as ActionRollVM

      await openPopover(component)
      vm.onRoll('straight')
      await nextTick()

      expect(vm.result).toBeDefined()

      await closePopover(component)

      expect(vm.result).toBeUndefined()
    })
  })

  describe('Rolling via the UI', () => {
    it('Should roll advantage, straight and disadvantage from their respective buttons', async () => {
      component = await mountSuspended(ActionRoll, { props, provide })
      const vm = component.vm as unknown as ActionRollVM

      await openPopover(component)

      const advantageButton = document.body.querySelector(
        '[test-id="advantage"]',
      ) as HTMLButtonElement
      advantageButton.click()
      await nextTick()
      expect(vm.result?.rollType).toBe('advantage')

      const straightButton = document.body.querySelector(
        '[test-id="straight"]',
      ) as HTMLButtonElement
      straightButton.click()
      await nextTick()
      expect(vm.result?.rollType).toBe('straight')

      const disadvantageButton = document.body.querySelector(
        '[test-id="disadvantage"]',
      ) as HTMLButtonElement
      disadvantageButton.click()
      await nextTick()
      expect(vm.result?.rollType).toBe('disadvantage')
    })
  })

  describe('Result rendering', () => {
    it('Should highlight a natural 20 and a natural 1 in the roll breakdown', async () => {
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99)
      component = await mountSuspended(ActionRoll, { props, provide })
      const vm = component.vm as unknown as ActionRollVM

      await openPopover(component)
      vm.onRoll('advantage')
      await nextTick()

      expect(
        document.body.querySelectorAll('.text-success.font-semibold').length,
      ).toBeGreaterThan(0)

      randomSpy.mockReturnValue(0)
      vm.onRoll('advantage')
      await nextTick()

      expect(
        document.body.querySelectorAll('.text-destructive.font-semibold')
          .length,
      ).toBeGreaterThan(0)

      randomSpy.mockRestore()
    })

    it('Should show the attack and damage bonuses when they are set', async () => {
      component = await mountSuspended(ActionRoll, { props, provide })
      const vm = component.vm as unknown as ActionRollVM

      await openPopover(component)
      vm.onRoll('advantage')
      await nextTick()

      expect(document.body.textContent).toContain(`+${props.attackBonus}`)
      expect(document.body.textContent).toContain(`+${props.damageBonus}`)
    })

    it('Should hide the attack and damage bonuses when they are falsy', async () => {
      component = await mountSuspended(ActionRoll, {
        props: { ...props, attackBonus: 0, damageBonus: 0 },
        provide,
      })
      const vm = component.vm as unknown as ActionRollVM

      await openPopover(component)
      vm.onRoll('advantage')
      await nextTick()

      expect(document.body.textContent).not.toContain('+0')
    })
  })

  describe('Submitting damage to a target', () => {
    const submitProps = {
      attackBonus: 5,
      damageDice: undefined,
      damageBonus: 2,
      id: sheet.rows[1]!.id,
    }
    const targetId = sheet.rows[0]!.id

    it('Should update the target, toast a concentration warning and close the popover', async () => {
      component = await mountSuspended(ActionRoll, {
        props: submitProps,
        provide,
      })
      const vm = component.vm as unknown as ActionRollVM

      vm.popoverOpen = true
      vm.onRoll('straight')
      vm.form.setFieldValue('target', targetId)
      await vm.onSubmit()

      expect(mockUpdate).toHaveBeenCalledWith({
        rows: expect.arrayContaining([
          expect.objectContaining({ id: targetId, tempHitPoints: 3 }),
        ]),
      })
      expect(mockToast).toHaveBeenCalledWith({
        title: expect.stringMatching(
          'components.initiativeTable.concentration.title',
        ),
        description: expect.stringMatching(
          'components.initiativeTable.concentration.text',
        ),
        variant: 'info',
      })
      expect(vm.popoverOpen).toBeFalsy()
    })

    it('Should not update when the selected target no longer exists on submit', async () => {
      component = await mountSuspended(ActionRoll, {
        props: submitProps,
        provide,
      })
      const vm = component.vm as unknown as ActionRollVM

      vm.onRoll('straight')
      vm.form.setFieldValue('target', targetId)

      mockSheet.value = {
        ...sheet,
        rows: sheet.rows.filter(row => row.id !== targetId),
      }

      await vm.onSubmit()

      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('Should not update when the sheet becomes undefined before submit', async () => {
      component = await mountSuspended(ActionRoll, {
        props: submitProps,
        provide,
      })
      const vm = component.vm as unknown as ActionRollVM

      vm.onRoll('straight')
      vm.form.setFieldValue('target', targetId)

      mockSheet.value = undefined

      await vm.onSubmit()

      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('Should set the thrown error message on the form when the update fails', async () => {
      mockUpdate.mockRejectedValueOnce(new Error('boom'))

      component = await mountSuspended(ActionRoll, {
        props: submitProps,
        provide,
      })
      const vm = component.vm as unknown as ActionRollVM

      vm.popoverOpen = true
      vm.onRoll('straight')
      vm.form.setFieldValue('target', targetId)
      await vm.onSubmit()
      await nextTick()

      expect(vm.formError).toBe('boom')
      expect(
        document.body.querySelector('[test-id="error"]')?.textContent,
      ).toBe('boom')
    })

    it('Should set a generic error message when the thrown error has no message', async () => {
      mockUpdate.mockRejectedValueOnce('')

      component = await mountSuspended(ActionRoll, {
        props: submitProps,
        provide,
      })
      const vm = component.vm as unknown as ActionRollVM

      vm.onRoll('straight')
      vm.form.setFieldValue('target', targetId)
      await vm.onSubmit()

      expect(vm.formError).toBe('An error occurred during action roll')
    })
  })
})
