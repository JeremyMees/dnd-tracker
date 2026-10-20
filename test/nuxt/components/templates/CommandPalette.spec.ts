import { resetToast } from '~~/test/nuxt/stubs/toast'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CommandPalette from '~/components/templates/CommandPalette.vue'
import { useCommandPalette } from '~/composables/useCommandPalette'
import { mockEncounterItem } from '~~/test/fixtures/encounter'
import { dndMonsterFixture } from '~~/test/fixtures/open5e/transformed'
import { sheet as sheetFixture } from '~~/test/fixtures/initiative-sheet'
import { dialogIsOpen, inDialog } from '~~/test/nuxt/stubs/dialog'
import { createInitiativeSheetProvide } from '~~/test/nuxt/stubs/initiative'
import { mountWithTooltips } from '~~/test/nuxt/stubs/tooltip'

const { navigateTo, monsterEnabled, encounterEnabled } = vi.hoisted(() => ({
  navigateTo: vi.fn(),
  monsterEnabled: { current: undefined as (() => boolean) | undefined },
  encounterEnabled: {
    current: undefined as { value: boolean } | undefined,
  },
}))

mockNuxtImport('navigateTo', () => navigateTo)

const user = ref<{ id: string; subscriptionType: string } | null>({
  id: '1',
  subscriptionType: 'free',
})
const commands = ref<PaletteCommand[]>([])
const monsters = ref<{ items: DndMonster[]; pages: number } | undefined>()
const encounters = ref<{ encounters: EncounterItem[] } | undefined>()

vi.mock('~/composables/useAuthentication', () => ({
  useAuthentication: () => ({ user }),
}))

vi.mock('~/composables/useCommands', () => ({
  useRegisteredCommands: () => commands,
}))

vi.mock('~/queries/srd', () => ({
  useSrdMonsterListing: (_data: unknown, enabled: () => boolean) => {
    monsterEnabled.current = enabled

    return { data: monsters, isFetching: ref(false) }
  },
}))

vi.mock('~/queries/encounters', () => ({
  useEncounterListing: (
    _data: unknown,
    enabled: { value: boolean },
    _perPage: number,
  ) => {
    encounterEnabled.current = enabled

    return { data: encounters, isFetching: ref(false) }
  },
}))

let component: VueWrapper | undefined

async function mountPalette(provide: Record<symbol, unknown> = {}) {
  component = await mountWithTooltips(CommandPalette, { global: { provide } })
}

async function pressShortcut(init: KeyboardEventInit): Promise<void> {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ...init }))
  await flushPromises()
}

async function openPalette(): Promise<void> {
  useCommandPalette().open.value = true
  await flushPromises()
}

async function typeSearch(value: string): Promise<void> {
  const input = inDialog('command-palette-input') as HTMLInputElement

  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await flushPromises()
  await vi.waitFor(() => {
    expect(inDialog('command-palette-loading')).toBeNull()
  })
  await flushPromises()
}

async function select(testId: string): Promise<void> {
  inDialog(testId)?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await flushPromises()
}

function command(id: string, overrides: Partial<PaletteCommand> = {}) {
  return {
    id,
    label: `label-${id}`,
    icon: 'tabler:bolt',
    run: vi.fn(),
    ...overrides,
  }
}

describe('CommandPalette', () => {
  beforeEach(() => {
    resetToast()
    navigateTo.mockReset()
    user.value = { id: '1', subscriptionType: 'free' }
    commands.value = []
    monsters.value = undefined
    encounters.value = undefined
  })

  afterEach(() => {
    component?.unmount()
    component = undefined
    useCommandPalette().open.value = false
  })

  it('Should open from the shared palette state', async () => {
    await mountPalette()

    expect(dialogIsOpen(component!)).toBe(false)

    await openPalette()

    expect(dialogIsOpen(component!)).toBe(true)
    expect(inDialog('command-palette')).not.toBeNull()
  })

  it('Should toggle with cmd or ctrl and k', async () => {
    await mountPalette()

    await pressShortcut({ metaKey: true })
    expect(dialogIsOpen(component!)).toBe(true)

    await pressShortcut({ ctrlKey: true })
    expect(dialogIsOpen(component!)).toBe(false)
  })

  it('Should ignore k without a modifier', async () => {
    await mountPalette()

    await pressShortcut({})

    expect(dialogIsOpen(component!)).toBe(false)
  })

  it('Should list the registered commands with their shortcut', async () => {
    commands.value = [command('next-turn', { shortcut: ['MOD', '→'] })]
    const modifier = /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘' : 'Ctrl'
    await mountPalette()
    await openPalette()

    const item = inDialog('command-next-turn')

    expect(item?.textContent).toContain('label-next-turn')
    expect(item?.textContent).toContain(modifier)
    expect(item?.textContent).toContain('→')
  })

  it('Should run a command and close the palette', async () => {
    const run = vi.fn()

    commands.value = [command('settings', { run })]
    await mountPalette()
    await openPalette()

    await select('command-settings')

    expect(run).toHaveBeenCalledOnce()
    expect(dialogIsOpen(component!)).toBe(false)
  })

  it('Should only search once two characters are typed', async () => {
    await mountPalette(createInitiativeSheetProvide().provide)
    await openPalette()

    await typeSearch('g')

    expect(monsterEnabled.current?.()).toBe(false)
    expect(encounterEnabled.current?.value).toBe(false)

    await typeSearch('go')

    expect(monsterEnabled.current?.()).toBe(true)
    expect(encounterEnabled.current?.value).toBe(true)
  })

  it('Should not search monsters outside an encounter', async () => {
    monsters.value = { items: [dndMonsterFixture], pages: 1 }
    await mountPalette()
    await openPalette()

    await typeSearch(dndMonsterFixture.name)

    expect(monsterEnabled.current?.()).toBe(false)
    expect(inDialog('command-monster')).toBeNull()
  })

  it('Should not search monsters when the encounter is full', async () => {
    const injected = createInitiativeSheetProvide({
      ...sheetFixture,
      rows: Array.from({ length: 50 }, (_, index) => ({
        ...sheetFixture.rows[0]!,
        id: `row-${index}`,
      })),
    })

    await mountPalette(injected.provide)
    await openPalette()
    await typeSearch('goblin')

    expect(monsterEnabled.current?.()).toBe(false)
  })

  it('Should add a found monster to the encounter', async () => {
    const injected = createInitiativeSheetProvide()

    monsters.value = { items: [dndMonsterFixture], pages: 1 }
    await mountPalette(injected.provide)
    await openPalette()
    await typeSearch(dndMonsterFixture.name)

    expect(
      inDialog('command-monster')
        ?.closest('[role="group"]')
        ?.hasAttribute('hidden'),
    ).toBe(false)

    await select('command-monster')

    expect(injected.update).toHaveBeenCalledWith({
      rows: expect.arrayContaining([
        expect.objectContaining({ name: dndMonsterFixture.name }),
      ]),
    })
    expect(dialogIsOpen(component!)).toBe(false)
  })

  it('Should add the first found monster with enter', async () => {
    const injected = createInitiativeSheetProvide()

    monsters.value = { items: [dndMonsterFixture], pages: 1 }
    await mountPalette(injected.provide)
    await openPalette()
    await typeSearch(dndMonsterFixture.name)

    inDialog('command-palette-input')?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    )
    await flushPromises()

    expect(injected.update).toHaveBeenCalledWith({
      rows: expect.arrayContaining([
        expect.objectContaining({ name: dndMonsterFixture.name }),
      ]),
    })
  })

  it('Should jump to a found encounter', async () => {
    encounters.value = { encounters: [mockEncounterItem] }
    await mountPalette()
    await openPalette()
    await typeSearch('goblin')

    const item = inDialog('command-encounter')

    expect(item?.closest('[role="group"]')?.hasAttribute('hidden')).toBe(false)

    expect(item?.textContent).toContain(mockEncounterItem.title)
    expect(item?.textContent).toContain(mockEncounterItem.campaign!.title)

    await select('command-encounter')

    expect(navigateTo).toHaveBeenCalledWith('/encounters/3-goblin-ambush')
  })

  it('Should not search encounters for a guest', async () => {
    user.value = null
    encounters.value = { encounters: [mockEncounterItem] }
    await mountPalette()
    await openPalette()
    await typeSearch('goblin')

    expect(encounterEnabled.current?.value).toBe(false)
    expect(inDialog('command-encounter')).toBeNull()
  })

  it('Should show an empty state when nothing matches', async () => {
    await mountPalette()
    await openPalette()
    await typeSearch('zzzzzz')

    expect(inDialog('command-palette-empty')).not.toBeNull()
  })

  it('Should clear the search when it closes', async () => {
    await mountPalette()
    await openPalette()
    await typeSearch('goblin')

    await pressShortcut({ metaKey: true })
    await openPalette()

    expect((inDialog('command-palette-input') as HTMLInputElement).value).toBe(
      '',
    )
  })
})
