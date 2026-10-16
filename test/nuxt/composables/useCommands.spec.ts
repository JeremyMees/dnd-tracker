import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import type { MaybeRefOrGetter } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useCommands, useRegisteredCommands } from '~/composables/useCommands'

function command(id: string, overrides: Partial<PaletteCommand> = {}) {
  return { id, label: id, icon: 'tabler:bolt', run: vi.fn(), ...overrides }
}

function mountCommands(commands: MaybeRefOrGetter<PaletteCommand[]>) {
  return mountSuspended(
    defineComponent({
      setup: () => useCommands(commands),
      template: '<div />',
    }),
  )
}

let components: VueWrapper[] = []

describe('useCommands', () => {
  afterEach(() => {
    components.forEach(component => component.unmount())
    components = []
  })

  it('Should list the commands of every mounted component', async () => {
    components = [
      await mountCommands([command('first')]),
      await mountCommands(() => [command('second'), command('third')]),
    ]

    expect(useRegisteredCommands().value.map(({ id }) => id)).toEqual([
      'first',
      'second',
      'third',
    ])
  })

  it('Should leave out disabled commands', async () => {
    components = [
      await mountCommands([
        command('enabled'),
        command('disabled', { disabled: true }),
      ]),
    ]

    expect(useRegisteredCommands().value.map(({ id }) => id)).toEqual([
      'enabled',
    ])
  })

  it('Should follow reactive commands', async () => {
    const disabled = ref(false)

    components = [
      await mountCommands(() => [
        command('toggle', { disabled: disabled.value }),
      ]),
    ]

    const commands = useRegisteredCommands()

    expect(commands.value).toHaveLength(1)

    disabled.value = true

    expect(commands.value).toHaveLength(0)
  })

  it('Should drop the commands once the component unmounts', async () => {
    const component = await mountCommands([command('gone')])

    expect(useRegisteredCommands().value).toHaveLength(1)

    component.unmount()

    expect(useRegisteredCommands().value).toHaveLength(0)
  })
})
