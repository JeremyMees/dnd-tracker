import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ActionRoll from '~/components/initiative/ActionRoll'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet } from '~~/test/unit/fixtures/initiative-sheet'

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
  targets: { label: string, value: string }[]
  result: RollResult | undefined
  popoverOpen: boolean
  onRoll: (type: RollType) => void
  onSubmit: () => Promise<void>
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

describe('ActionRoll component', () => {
  beforeEach(() => {
    mockUpdate.mockClear()
    mockToast.mockClear()
    mockSheet.value = sheet
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(ActionRoll, { props, provide })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should have result undefined and popoverOpen false initially', async () => {
    const component = await mountSuspended(ActionRoll, { props, provide })

    const vm = component.vm as unknown as ActionRollVM
    expect(vm.result).toBeUndefined()
    expect(vm.popoverOpen).toBe(false)
  })

  describe('Roll functionality', () => {
    it('Should roll straight with single die', async () => {
      const component = await mountSuspended(ActionRoll, { props, provide })

      const vm = component.vm as unknown as ActionRollVM
      vm.onRoll('straight')
      await nextTick()

      expect(vm.result).toBeDefined()
      expect(vm.result?.rollType).toBe('straight')
      expect(vm.result?.rolledToHit.length).toBe(1)
    })

    it('Should roll advantage with two dice and take highest', async () => {
      const component = await mountSuspended(ActionRoll, { props, provide })

      const vm = component.vm as unknown as ActionRollVM
      vm.onRoll('advantage')
      await nextTick()

      expect(vm.result).toBeDefined()
      expect(vm.result?.rollType).toBe('advantage')
      expect(vm.result?.rolledToHit.length).toBe(2)
      expect(vm.result?.attackRoll).toBe(Math.max(...vm.result!.rolledToHit))
    })

    it('Should roll disadvantage with two dice and take lowest', async () => {
      const component = await mountSuspended(ActionRoll, { props, provide })

      const vm = component.vm as unknown as ActionRollVM
      vm.onRoll('disadvantage')
      await nextTick()

      expect(vm.result).toBeDefined()
      expect(vm.result?.rollType).toBe('disadvantage')
      expect(vm.result?.rolledToHit.length).toBe(2)
      expect(vm.result?.attackRoll).toBe(Math.min(...vm.result!.rolledToHit))
    })

    it('Should calculate attackTotal with attackBonus and totalDamage with damageBonus', async () => {
      const component = await mountSuspended(ActionRoll, { props, provide })

      const vm = component.vm as unknown as ActionRollVM
      vm.onRoll('straight')
      await nextTick()

      const baseDamage = Object.values(vm.result!.damageRolled).flat().reduce((acc, curr) => acc + curr, 0)

      expect(vm.result).toBeDefined()
      expect(vm.result?.attackTotal).toBe(vm.result!.attackRoll + props.attackBonus!)
      expect(vm.result?.totalDamage).toBe(baseDamage + props.damageBonus)
    })

    it('Should handle undefined attackBonus', async () => {
      const component = await mountSuspended(ActionRoll, {
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
      const component = await mountSuspended(ActionRoll, {
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
      const component = await mountSuspended(ActionRoll, {
        props: { ...props, damageBonus: 0 },
        provide,
      })

      const vm = component.vm as unknown as ActionRollVM
      vm.onRoll('straight')
      await nextTick()

      const baseDamage = Object.values(vm.result!.damageRolled).flat().reduce((acc, curr) => acc + curr, 0)

      expect(vm.result).toBeDefined()
      expect(vm.result?.totalDamage).toBe(baseDamage)
    })
  })

  describe('Target selection', () => {
    it('Should filter out current row and include all other rows as targets', async () => {
      const component = await mountSuspended(ActionRoll, { props, provide })

      const vm = component.vm as unknown as ActionRollVM
      const targets = vm.targets

      expect(targets.find(t => t.value === props.id)).toBeUndefined()
      expect(targets.length).toBe(sheet.rows.length - 1)

      const otherRows = sheet.rows.filter(row => row.id !== props.id)
      otherRows.forEach((row) => {
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

      const component = await mountSuspended(ActionRoll, { props, provide })

      const vm = component.vm as unknown as ActionRollVM
      await vm.onSubmit()

      expect(mockUpdate).not.toHaveBeenCalled()
    })
  })
})
