import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Bestiary from '~/components/form/Bestiary.vue'
import MonsterCard from '~/components/molecules/MonsterCard.vue'
import SkeletonMonsterCard from '~/components/skeleton/MonsterCard.vue'
import { dndMonsterFixture } from '~~/test/fixtures/open5e'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { createInitiativeSheetProvide } from '~~/test/nuxt/stubs/initiative'

const { toast } = vi.hoisted(() => ({ toast: vi.fn() }))

const monstersStatus = ref('success')
const documentsStatus = ref('success')
const data = ref<{ items: DndMonster[]; pages: number }>({
  items: [dndMonsterFixture],
  pages: 1,
})

vi.mock('~/components/ui/toast/use-toast', () => ({
  useToast: () => ({ toast }),
}))

vi.mock('~/queries/open5e', () => ({
  useOpen5eMonsterListing: () => ({ data, status: monstersStatus }),
  useOpen5eDocuments: () => ({ data: ref([]), status: documentsStatus }),
}))

function mountBestiary(props: Record<string, unknown> = {}) {
  const injected = createInitiativeSheetProvide()

  return {
    injected,
    mount: () => mountSuspended(Bestiary, { props, provide: injected.provide }),
  }
}

describe('Bestiary', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    monstersStatus.value = 'success'
    documentsStatus.value = 'success'
    data.value = { items: [dndMonsterFixture], pages: 1 }
  })

  it('Should match snapshot', async () => {
    const component = await mountBestiary().mount()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render the search, challenge, sort and system filters', async () => {
    const component = await mountBestiary().mount()
    const text = component.text()

    expect(component.find('input[name="search"]').exists()).toBeTruthy()
    expect(text).toContain('components.inputs.challengeLabel')
    expect(text).toContain('components.addInitiativeMonster.sort.title')
    expect(text).toContain('components.inputs.gameSystemLabel')
  })

  it('Should render a card per monster', async () => {
    const component = await mountBestiary().mount()

    expect(component.findAllComponents(MonsterCard)).toHaveLength(1)
  })

  it('Should show skeletons while the monsters load', async () => {
    monstersStatus.value = 'pending'

    const component = await mountBestiary().mount()

    expect(component.findAllComponents(MonsterCard)).toHaveLength(0)
    expect(
      component.findAllComponents(SkeletonMonsterCard).length,
    ).toBeGreaterThan(0)
  })

  it('Should show skeletons while the documents load', async () => {
    documentsStatus.value = 'pending'

    const component = await mountBestiary().mount()

    expect(component.findAllComponents(MonsterCard)).toHaveLength(0)
  })

  it('Should show the error state when a query fails', async () => {
    monstersStatus.value = 'error'

    const component = await mountBestiary().mount()

    expect(component.text()).toContain('components.dndContentSearch.error')
  })

  it('Should not show the not found message without a search', async () => {
    data.value = { items: [], pages: 0 }

    const component = await mountBestiary().mount()

    expect(component.text()).not.toContain(
      'components.dndContentSearch.notFound',
    )
  })

  it('Should show the not found message when a search has no results', async () => {
    data.value = { items: [], pages: 0 }

    const component = await mountBestiary().mount()

    await component.get('input[name="search"]').setValue('nothing here')
    await flushPromises()

    expect(component.text()).toContain('components.dndContentSearch.notFound')
  })

  it('Should show pagination when there is more than one page', async () => {
    data.value = { items: [dndMonsterFixture], pages: 3 }

    const component = await mountBestiary().mount()

    expect(
      component.findComponent({ name: 'Pagination' }).exists(),
    ).toBeTruthy()
  })

  it('Should not show pagination for a single page', async () => {
    const component = await mountBestiary().mount()

    expect(component.findComponent({ name: 'Pagination' }).exists()).toBeFalsy()
  })

  it('Should append the monster to the rows of the sheet', async () => {
    const { injected, mount } = mountBestiary()
    const component = await mount()

    await component
      .findComponent(MonsterCard)
      .vm.$emit('add', dndMonsterFixture)
    await flushPromises()

    const rows = injected.update.mock.calls[0]![0].rows

    expect(rows).toHaveLength(sheet.rows.length + 1)
    expect(rows.at(-1)!.name).toBe(dndMonsterFixture.name)
    expect(rows.at(-1)!.type).toBe('monster')
  })

  it('Should reindex the rows after adding a monster', async () => {
    const { injected, mount } = mountBestiary()
    const component = await mount()

    await component
      .findComponent(MonsterCard)
      .vm.$emit('add', dndMonsterFixture)
    await flushPromises()

    const rows = injected.update.mock.calls[0]![0].rows

    expect(rows.map((row: InitiativeSheetRow) => row.index)).toEqual(
      rows.map((_row: InitiativeSheetRow, index: number) => index),
    )
  })

  it('Should toast after adding a monster', async () => {
    const component = await mountBestiary().mount()

    await component
      .findComponent(MonsterCard)
      .vm.$emit('add', dndMonsterFixture)
    await flushPromises()

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'success' }),
    )
  })

  it('Should not add a monster without a sheet', async () => {
    const injected = createInitiativeSheetProvide(null)

    const component = await mountSuspended(Bestiary, {
      provide: injected.provide,
    })

    await component
      .findComponent(MonsterCard)
      .vm.$emit('add', dndMonsterFixture)
    await flushPromises()

    expect(injected.update).not.toHaveBeenCalled()
    expect(toast).not.toHaveBeenCalled()
  })
})
