import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HomebrewStart from '~/components/form/HomebrewStart.vue'
import ImportButton from '~/components/atoms/ImportButton.vue'
import { homebrewType } from '~~/constants/validation'
import { dndMonsterFixture } from '~~/test/fixtures/open5e'

const { read } = vi.hoisted(() => ({ read: vi.fn() }))

mockNuxtImport('useTransferFile', () => () => ({ read, download: vi.fn() }))

const goblin = { name: 'Goblin', type: 'monster', actions: [] }
const kees = { name: 'Kees', type: 'player', actions: [] }
const file = new File(['{}'], 'creatures.json')

const FormBestiaryStub = defineComponent({
  props: { addable: Boolean, persist: String },
  emits: ['remix'],
  template: '<div test-id="bestiary" />',
})

let wrapper: VueWrapper | undefined

async function mountStart(step: HomebrewStartStep = 'type') {
  wrapper = await mountSuspended(HomebrewStart, {
    props: {
      step,
      'onUpdate:step': (value: HomebrewStartStep) =>
        wrapper!.setProps({ step: value }),
    },
    global: { stubs: { FormBestiary: FormBestiaryStub } },
  })

  return wrapper
}

function lastStep(component: VueWrapper) {
  return component.emitted<[HomebrewStartStep]>('update:step')?.at(-1)?.[0]
}

async function click(component: VueWrapper, testId: string) {
  await component.get(`[test-id="${testId}"]`).trigger('click')
  await nextTick()
}

describe('HomebrewStart', () => {
  beforeEach(() => {
    read.mockReset()
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  describe('Type step', () => {
    it('Should show a described card per homebrew type', async () => {
      const component = await mountStart()

      for (const type of homebrewType) {
        expect(component.get(`[test-id="choice-${type}"]`).text()).toContain(
          `components.homebrewModal.types.${type}`,
        )
      }
    })

    it('Should not offer to go back', async () => {
      const component = await mountStart()

      expect(component.find('[test-id="step-back"]').exists()).toBe(false)
    })

    it('Should emit the picked type', async () => {
      const component = await mountStart()

      await click(component, 'choice-npc')

      expect(component.emitted('type')).toEqual([['npc']])
      expect(lastStep(component)).toBeUndefined()
    })

    it('Should ask where to start instead of emitting for a creature', async () => {
      const component = await mountStart()

      await click(component, 'choice-monster')

      expect(component.emitted('type')).toBeUndefined()
      expect(lastStep(component)).toBe('source')
      expect(component.find('[test-id="choice-scratch"]').exists()).toBe(true)
    })
  })

  describe('Source step', () => {
    it('Should offer scratch, the bestiary and a file', async () => {
      const component = await mountStart('source')

      expect(component.find('[test-id="choice-scratch"]').exists()).toBe(true)
      expect(component.find('[test-id="choice-bestiary"]').exists()).toBe(true)
      expect(component.find('[test-id="choice-file"]').exists()).toBe(true)
    })

    it('Should open the file step', async () => {
      const component = await mountStart('source')

      await click(component, 'choice-file')

      expect(lastStep(component)).toBe('file')
      expect(component.findComponent(ImportButton).exists()).toBe(true)
    })

    it('Should go back to the type cards', async () => {
      const component = await mountStart('source')

      await click(component, 'step-back')

      expect(lastStep(component)).toBe('type')
      expect(component.find('[test-id="choice-npc"]').exists()).toBe(true)
    })

    it('Should emit scratch', async () => {
      const component = await mountStart('source')

      await click(component, 'choice-scratch')

      expect(component.emitted('scratch')).toHaveLength(1)
    })

    it('Should open the bestiary', async () => {
      const component = await mountStart('source')

      await click(component, 'choice-bestiary')

      expect(lastStep(component)).toBe('bestiary')
      expect(component.findComponent(FormBestiaryStub).exists()).toBe(true)
    })
  })

  describe('Bestiary step', () => {
    it('Should show the bestiary without the add button and remember its filters', async () => {
      const component = await mountStart('bestiary')

      const bestiary = component.findComponent(FormBestiaryStub)

      expect(bestiary.props('addable')).toBe(false)
      expect(bestiary.props('persist')).toBe('local')
    })

    it('Should explain how to pick a monster', async () => {
      const component = await mountStart('bestiary')

      expect(component.get('[test-id="step-description"]').text()).toContain(
        'components.homebrewModal.pickMonsterInfo',
      )
    })

    it('Should go back to the start cards', async () => {
      const component = await mountStart('bestiary')

      await click(component, 'step-back')

      expect(lastStep(component)).toBe('source')
      expect(component.findComponent(FormBestiaryStub).exists()).toBe(false)
    })

    it('Should emit the remixed monster', async () => {
      const component = await mountStart('bestiary')

      await component
        .findComponent(FormBestiaryStub)
        .vm.$emit('remix', dndMonsterFixture)

      expect(component.emitted('monster')).toEqual([[dndMonsterFixture]])
    })
  })

  describe('File step', () => {
    async function importFile(component: VueWrapper) {
      component.findComponent(ImportButton).vm.$emit('import', file)
      await flushPromises()
    }

    it('Should accept every creature file type', async () => {
      const component = await mountStart('file')

      expect(component.findComponent(ImportButton).props('accept')).toBe(
        creatureFileTypes,
      )
    })

    it('Should explain what files work', async () => {
      const component = await mountStart('file')

      expect(component.get('[test-id="step-description"]').text()).toContain(
        'components.homebrewModal.pickFileInfo',
      )
    })

    it('Should read the file without a room limit', async () => {
      const component = await mountStart('file')

      await importFile(component)

      expect(read).toHaveBeenCalledWith(
        file,
        'homebrews',
        Number.POSITIVE_INFINITY,
      )
    })

    it('Should emit the creature right away when the file holds one', async () => {
      read.mockResolvedValue([goblin])

      const component = await mountStart('file')

      await importFile(component)

      expect(component.emitted('creature')).toEqual([[goblin]])
      expect(component.find('[test-id="file-creatures"]').exists()).toBe(false)
    })

    it('Should let you pick when the file holds more creatures', async () => {
      read.mockResolvedValue([goblin, kees])

      const component = await mountStart('file')

      await importFile(component)

      const buttons = component.findAll('[test-id="file-creature"]')

      expect(buttons.map(button => button.text())).toEqual(['Goblin', 'Kees'])
      expect(component.emitted('creature')).toBeUndefined()

      await buttons[1]!.trigger('click')

      expect(component.emitted('creature')).toEqual([[kees]])
    })

    it('Should do nothing when the file is rejected', async () => {
      read.mockResolvedValue(undefined)

      const component = await mountStart('file')

      await importFile(component)

      expect(component.emitted('creature')).toBeUndefined()
      expect(component.find('[test-id="file-creatures"]').exists()).toBe(false)
    })

    it('Should go back to the start cards and forget the creatures', async () => {
      read.mockResolvedValue([goblin, kees])

      const component = await mountStart('file')

      await importFile(component)
      await click(component, 'step-back')

      expect(lastStep(component)).toBe('source')

      await click(component, 'choice-file')

      expect(component.find('[test-id="file-creatures"]').exists()).toBe(false)
    })
  })
})
