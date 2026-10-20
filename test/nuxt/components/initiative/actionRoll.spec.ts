import { toast } from '~~/test/nuxt/stubs/toast'
import { flushPromises } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ActionRoll from '~/components/initiative/ActionRoll.vue'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import {
  bloodiedCondition,
  storedBloodiedCondition,
} from '~~/test/fixtures/bloodied-condition'
import { closePopover, openPopover } from '~~/test/nuxt/stubs/popover'
import { mountWithTooltips } from '~~/test/nuxt/stubs/tooltip'

type RollType = 'advantage' | 'straight' | 'disadvantage'

interface RollResult {
  attackRoll: number
  attackTotal: number
  rolledToHit: number[]
  damageRolled: Record<number, number[]>
  totalDamage: number
  rollType: RollType
  miss: boolean
}

interface ActionRollVM {
  targets: { label: string; value: string }[]
  result: RollResult | undefined
  popoverOpen: boolean
  onRoll: (type: RollType) => void
  onSubmit: () => Promise<void>
  form: { setFieldValue: (field: string, value: unknown) => void }
}

const mockPatchRow = vi.fn()
const mockSheet = ref<InitiativeSheet | undefined>(sheet)
const mockActiveRow = ref<InitiativeSheetRow | undefined>()
const mockConditions = ref<DndCondition[]>([])

vi.mock('~/queries/srd', () => ({
  useConditionsListing: () => ({ data: mockConditions }),
}))

const provide = {
  [INITIATIVE_SHEET]: {
    sheet: mockSheet,
    patchRow: mockPatchRow,
    activeRow: mockActiveRow,
  },
}

const props = {
  attackBonus: 5,
  damage: [{ dice: '2d6', bonus: 3 }] as DndAttackDamage[],
  id: sheet.rows[0]!.id,
}

let component: VueWrapper<InstanceType<typeof ActionRoll>>

describe('ActionRoll component', () => {
  beforeEach(() => {
    mockSheet.value = sheet
    mockConditions.value = []
  })

  it('Should match snapshot', async () => {
    component = await mountWithTooltips(ActionRoll, { props, provide })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should open the popover when the trigger is clicked', async () => {
    component = await mountWithTooltips(ActionRoll, { props, provide })

    await component.find('[test-id="trigger"]').trigger('click')
    await flushPromises()

    const vm = component.vm as unknown as ActionRollVM
    expect(vm.popoverOpen).toBe(true)
  })

  it('Should have result undefined and popoverOpen false initially', async () => {
    component = await mountWithTooltips(ActionRoll, { props, provide })

    const vm = component.vm as unknown as ActionRollVM
    expect(vm.result).toBeUndefined()
    expect(vm.popoverOpen).toBeFalsy()
  })

  describe('Roll functionality', () => {
    it('Should roll straight with single die', async () => {
      component = await mountWithTooltips(ActionRoll, { props, provide })

      const vm = component.vm as unknown as ActionRollVM
      vm.onRoll('straight')
      await nextTick()

      expect(vm.result).toBeDefined()
      expect(vm.result?.rollType).toBe('straight')
      expect(vm.result?.rolledToHit.length).toBe(1)
    })

    it('Should roll advantage with two dice and take highest', async () => {
      component = await mountWithTooltips(ActionRoll, { props, provide })

      const vm = component.vm as unknown as ActionRollVM
      vm.onRoll('advantage')
      await nextTick()

      expect(vm.result).toBeDefined()
      expect(vm.result?.rollType).toBe('advantage')
      expect(vm.result?.rolledToHit.length).toBe(2)
      expect(vm.result?.attackRoll).toBe(Math.max(...vm.result!.rolledToHit))
    })

    it('Should roll disadvantage with two dice and take lowest', async () => {
      component = await mountWithTooltips(ActionRoll, { props, provide })

      const vm = component.vm as unknown as ActionRollVM
      vm.onRoll('disadvantage')
      await nextTick()

      expect(vm.result).toBeDefined()
      expect(vm.result?.rollType).toBe('disadvantage')
      expect(vm.result?.rolledToHit.length).toBe(2)
      expect(vm.result?.attackRoll).toBe(Math.min(...vm.result!.rolledToHit))
    })

    it('Should calculate attackTotal with attackBonus and totalDamage with the damage bonus', async () => {
      component = await mountWithTooltips(ActionRoll, { props, provide })

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
      expect(vm.result?.totalDamage).toBe(baseDamage + props.damage[0]!.bonus)
    })

    it('Should handle undefined attackBonus', async () => {
      component = await mountWithTooltips(ActionRoll, {
        props: { ...props, attackBonus: undefined },
        provide,
      })

      const vm = component.vm as unknown as ActionRollVM
      vm.onRoll('straight')
      await nextTick()

      expect(vm.result).toBeDefined()
      expect(vm.result?.attackTotal).toBe(vm.result?.attackRoll)
    })

    it('Should handle damage without dice', async () => {
      component = await mountWithTooltips(ActionRoll, {
        props: { ...props, damage: [{ bonus: 3 }] },
        provide,
      })

      const vm = component.vm as unknown as ActionRollVM
      vm.onRoll('straight')
      await nextTick()

      expect(vm.result).toBeDefined()
      expect(vm.result?.totalDamage).toBe(props.damage[0]!.bonus)
    })

    it('Should handle a zero damage bonus', async () => {
      component = await mountWithTooltips(ActionRoll, {
        props: { ...props, damage: [{ dice: '2d6', bonus: 0 }] },
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
      component = await mountWithTooltips(ActionRoll, { props, provide })

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

    it('Should leave out rows without hit points', async () => {
      const statue = { ...sheet.rows[1]!, id: 'statue', hitPoints: undefined }

      mockSheet.value = { ...sheet, rows: [...sheet.rows, statue] }
      component = await mountWithTooltips(ActionRoll, { props, provide })

      const vm = component.vm as unknown as ActionRollVM

      expect(vm.targets.find(t => t.value === 'statue')).toBeUndefined()
      expect(vm.targets.length).toBe(sheet.rows.length - 1)
    })

    it('Should have no targets when sheet has only current row or empty rows', async () => {
      mockSheet.value = { ...sheet, rows: [sheet.rows[0]!] }
      const component1 = await mountWithTooltips(ActionRoll, { props, provide })
      expect((component1.vm as unknown as ActionRollVM).targets?.length).toBe(0)

      mockSheet.value = { ...sheet, rows: [] }
      const component2 = await mountWithTooltips(ActionRoll, { props, provide })
      expect((component2.vm as unknown as ActionRollVM).targets?.length).toBe(0)
    })

    it('Should not call update when sheet is undefined', async () => {
      mockSheet.value = undefined

      component = await mountWithTooltips(ActionRoll, { props, provide })

      const vm = component.vm as unknown as ActionRollVM
      await vm.onSubmit()

      expect(mockPatchRow).not.toHaveBeenCalled()
    })
  })

  describe('Damage dice', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('Should roll every die when several dice share the same sides', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5)

      component = await mountWithTooltips(ActionRoll, {
        props: { ...props, damage: [{ dice: '2d6 + 1d6', bonus: 3 }] },
        provide,
      })

      const vm = component.vm as unknown as ActionRollVM
      vm.onRoll('straight')
      await nextTick()

      expect(vm.result?.damageRolled[6]?.length).toBe(3)
    })
  })

  describe('Natural 1', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('Should mark a natural 1 as a miss and hide the target form', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0)
      component = await mountWithTooltips(ActionRoll, { props, provide })
      const vm = component.vm as unknown as ActionRollVM

      await openPopover(component)
      vm.onRoll('straight')
      await nextTick()

      expect(vm.result?.miss).toBe(true)
      expect(document.body.querySelector('[test-id="miss"]')).toBeTruthy()
      expect(document.body.querySelector('[test-id="submit"]')).toBeNull()
    })

    it('Should not mark other rolls as a miss', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5)
      component = await mountWithTooltips(ActionRoll, { props, provide })
      const vm = component.vm as unknown as ActionRollVM

      await openPopover(component)
      vm.onRoll('straight')
      await nextTick()

      expect(vm.result?.miss).toBe(false)
      expect(document.body.querySelector('[test-id="miss"]')).toBeNull()
      expect(document.body.querySelector('[test-id="submit"]')).toBeTruthy()
    })

    it('Should not apply damage after a natural 1', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0)
      component = await mountWithTooltips(ActionRoll, { props, provide })
      const vm = component.vm as unknown as ActionRollVM

      vm.onRoll('straight')
      vm.form.setFieldValue('target', sheet.rows[1]!.id)
      await vm.onSubmit()

      expect(mockPatchRow).not.toHaveBeenCalled()
    })
  })

  describe('Critical hits', () => {
    it('Should double the damage dice rolled on a natural 20', async () => {
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99)
      component = await mountWithTooltips(ActionRoll, { props, provide })

      const vm = component.vm as unknown as ActionRollVM
      vm.onRoll('straight')
      await nextTick()

      expect(vm.result?.attackRoll).toBe(20)
      expect(vm.result?.damageRolled[6]?.length).toBe(4)

      randomSpy.mockRestore()
    })

    it('Should not double the damage dice when the attack roll is not a natural 20', async () => {
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0)
      component = await mountWithTooltips(ActionRoll, { props, provide })

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
      component = await mountWithTooltips(ActionRoll, { props, provide })

      await openPopover(component)

      expect(document.body.querySelector('[test-id="advantage"]')).toBeTruthy()
      expect(document.body.querySelector('[test-id="straight"]')).toBeTruthy()
      expect(
        document.body.querySelector('[test-id="disadvantage"]'),
      ).toBeTruthy()
      expect(document.body.textContent).toContain('actions.roll')
    })

    it('Should reset the roll result when the popover is closed', async () => {
      component = await mountWithTooltips(ActionRoll, { props, provide })
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
      component = await mountWithTooltips(ActionRoll, { props, provide })
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
      component = await mountWithTooltips(ActionRoll, { props, provide })
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
      component = await mountWithTooltips(ActionRoll, { props, provide })
      const vm = component.vm as unknown as ActionRollVM

      await openPopover(component)
      vm.onRoll('advantage')
      await nextTick()

      expect(document.body.textContent).toContain(`+${props.attackBonus}`)
      expect(document.body.textContent).toContain(`+${props.damage[0]!.bonus}`)
    })

    it('Should hide the attack and damage bonuses when they are falsy', async () => {
      component = await mountWithTooltips(ActionRoll, {
        props: {
          ...props,
          attackBonus: 0,
          damage: [{ dice: '2d6', bonus: 0 }],
        },
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
      damage: [{ bonus: 2 }] as DndAttackDamage[],
      id: sheet.rows[1]!.id,
    }
    const targetId = sheet.rows[0]!.id

    beforeEach(() => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5)
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('Should update the target, toast a concentration warning and close the popover', async () => {
      component = await mountWithTooltips(ActionRoll, {
        props: submitProps,
        provide,
      })
      const vm = component.vm as unknown as ActionRollVM

      vm.popoverOpen = true
      vm.onRoll('straight')
      vm.form.setFieldValue('target', targetId)
      await vm.onSubmit()

      expect(mockPatchRow).toHaveBeenCalledWith(targetId, { tempHitPoints: 3 })
      expect(toast.info).toHaveBeenCalledWith(
        expect.stringMatching('components.initiativeTable.concentration.title'),
        {
          description: expect.stringMatching(
            'components.initiativeTable.concentration.text',
          ),
        },
      )
      expect(vm.popoverOpen).toBeFalsy()
    })

    it('Should add bloodied when the damage drops the target to half hp', async () => {
      const target = {
        ...sheet.rows[0]!,
        hitPoints: 52,
        tempHitPoints: undefined,
        concentration: false,
      }

      mockConditions.value = [bloodiedCondition]
      mockSheet.value = { ...sheet, rows: [target, ...sheet.rows.slice(1)] }

      component = await mountWithTooltips(ActionRoll, {
        props: submitProps,
        provide,
      })
      const vm = component.vm as unknown as ActionRollVM

      vm.onRoll('straight')
      vm.form.setFieldValue('target', targetId)
      await vm.onSubmit()

      expect(mockPatchRow).toHaveBeenCalledWith(targetId, {
        hitPoints: 50,
        conditions: [...target.conditions, storedBloodiedCondition],
      })
    })

    describe('Damage defenses', () => {
      const defended = {
        ...sheet.rows[0]!,
        hitPoints: 52,
        tempHitPoints: undefined,
        concentration: false,
        conditions: [],
        resistancesAndImmunities: {
          damageImmunities: ['poison'],
          damageResistances: ['fire'],
          damageVulnerabilities: ['cold'],
          conditionImmunities: [],
        },
      } as InitiativeSheetRow

      async function rollAgainst(damage: DndAttackDamage[]) {
        mockSheet.value = { ...sheet, rows: [defended, ...sheet.rows.slice(1)] }

        component = await mountWithTooltips(ActionRoll, {
          props: { ...submitProps, damage },
          provide,
        })

        const vm = component.vm as unknown as ActionRollVM

        vm.onRoll('straight')
        vm.form.setFieldValue('target', targetId)
        await flushPromises()

        return vm
      }

      it('Should apply each damage type against the target defenses', async () => {
        const vm = await rollAgainst([
          { bonus: 10, type: 'fire' },
          { bonus: 6, type: 'acid' },
        ])

        await vm.onSubmit()

        expect(mockPatchRow).toHaveBeenCalledWith(targetId, { hitPoints: 41 })
      })

      it('Should ignore immune damage and double vulnerable damage', async () => {
        const vm = await rollAgainst([
          { bonus: 10, type: 'poison' },
          { bonus: 6, type: 'cold' },
        ])

        await vm.onSubmit()

        expect(mockPatchRow).toHaveBeenCalledWith(targetId, { hitPoints: 40 })
      })

      it('Should show the target defenses before applying', async () => {
        mockSheet.value = { ...sheet, rows: [defended, ...sheet.rows.slice(1)] }

        component = await mountWithTooltips(ActionRoll, {
          props: {
            ...submitProps,
            damage: [
              { bonus: 10, type: 'fire' },
              { bonus: 6, type: 'acid' },
            ],
          },
          provide,
        })

        const vm = component.vm as unknown as ActionRollVM

        await openPopover(component)
        vm.onRoll('straight')
        vm.form.setFieldValue('target', targetId)
        await flushPromises()

        const preview = document.body.querySelector('[test-id="target-damage"]')

        expect(preview?.querySelectorAll('[test-id="defense"]')).toHaveLength(1)
        expect(preview?.textContent).toContain(
          'components.areaDamage.defense.resistant',
        )
      })

      it('Should not show a preview when the target has no matching defenses', async () => {
        const vm = await rollAgainst([{ bonus: 10, type: 'acid' }])

        await openPopover(component)
        vm.onRoll('straight')
        await flushPromises()

        expect(
          document.body.querySelector('[test-id="target-damage"]'),
        ).toBeNull()
      })
    })

    it('Should add two death save failures when a critical hit lands on a target at 0 hp', async () => {
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99)
      const target = {
        ...sheet.rows[0]!,
        hitPoints: 0,
        tempHitPoints: undefined,
        deathSaves: {
          fail: [false, false, false],
          save: [false, false, false],
        },
      } as InitiativeSheetRow

      mockSheet.value = { ...sheet, rows: [target, ...sheet.rows.slice(1)] }

      component = await mountWithTooltips(ActionRoll, {
        props: submitProps,
        provide,
      })
      const vm = component.vm as unknown as ActionRollVM

      vm.onRoll('straight')
      vm.form.setFieldValue('target', targetId)
      await vm.onSubmit()

      expect(mockPatchRow).toHaveBeenCalledWith(
        targetId,
        expect.objectContaining({
          deathSaves: {
            fail: [true, true, false],
            save: [false, false, false],
          },
        }),
      )

      randomSpy.mockRestore()
    })

    it('Should not update when the selected target no longer exists on submit', async () => {
      component = await mountWithTooltips(ActionRoll, {
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

      expect(mockPatchRow).not.toHaveBeenCalled()
    })

    it('Should not update when the sheet becomes undefined before submit', async () => {
      component = await mountWithTooltips(ActionRoll, {
        props: submitProps,
        provide,
      })
      const vm = component.vm as unknown as ActionRollVM

      vm.onRoll('straight')
      vm.form.setFieldValue('target', targetId)

      mockSheet.value = undefined

      await vm.onSubmit()

      expect(mockPatchRow).not.toHaveBeenCalled()
    })

    it('Should keep the popover open without an inline error when the update fails', async () => {
      mockPatchRow.mockRejectedValueOnce(new Error('boom'))

      component = await mountWithTooltips(ActionRoll, {
        props: submitProps,
        provide,
      })
      const vm = component.vm as unknown as ActionRollVM

      vm.popoverOpen = true
      vm.onRoll('straight')
      vm.form.setFieldValue('target', targetId)
      await vm.onSubmit()
      await nextTick()

      expect(vm.popoverOpen).toBe(true)
      expect(document.body.querySelector('[test-id="error"]')).toBeNull()
    })
  })
})
