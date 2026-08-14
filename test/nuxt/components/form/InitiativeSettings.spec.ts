import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import InitiativeSettings from '~/components/form/InitiativeSettings.vue'
import {
  initiativeDefaultRows,
  initiativeWidgets,
} from '~~/constants/validation'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { submitForm } from '~~/test/nuxt/stubs/form'
import { createInitiativeSheetProvide } from '~~/test/nuxt/stubs/initiative'

function mountSettings({ withSheet = true } = {}) {
  const injected = createInitiativeSheetProvide(withSheet ? sheet : null)

  return {
    injected,
    mount: () =>
      mountSuspended(InitiativeSettings, { provide: injected.provide }),
  }
}

describe('InitiativeSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Should match snapshot', async () => {
    const component = await mountSettings().mount()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render the settings fields and a save button', async () => {
    const component = await mountSettings().mount()

    expect(component.text()).toContain('components.initiativeSettings.spacing')
    expect(component.get('button[type="submit"]').text()).toBe('actions.save')
  })

  it('Should seed the form from the settings of the sheet', async () => {
    const component = await mountSettings().mount()

    const checked = component
      .findAll('[role="radio"]')
      .filter(radio => radio.attributes('aria-checked') === 'true')

    expect(checked[0]!.attributes('value')).toBe(sheet.settings!.spacing)
  })

  it('Should save the settings and mark them as modified', async () => {
    const { injected, mount } = mountSettings()
    const component = await mount()

    await submitForm(component)

    expect(injected.update).toHaveBeenCalledWith({
      settings: {
        spacing: 'normal',
        rows: [...initiativeDefaultRows],
        widgets: [...initiativeWidgets],
        pet: 'cat',
        negative: false,
        modified: true,
      },
    })
  })

  it('Should preserve existing live settings when saving', async () => {
    const injected = createInitiativeSheetProvide({
      ...sheet,
      settings: {
        ...sheet.settings!,
        live: { hideMonsterNames: true },
      },
    })
    const component = await mountSuspended(InitiativeSettings, {
      provide: injected.provide,
    })

    await submitForm(component)

    expect(injected.update).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({
          live: { hideMonsterNames: true },
        }),
      }),
    )
  })

  it('Should emit close after saving', async () => {
    const component = await mountSettings().mount()

    await submitForm(component)

    expect(component.emitted('close')).toHaveLength(1)
  })

  it('Should not save without a sheet', async () => {
    const { injected, mount } = mountSettings({ withSheet: false })
    const component = await mount()

    await submitForm(component)

    expect(injected.update).not.toHaveBeenCalled()
    expect(component.emitted('close')).toBeUndefined()
  })

  it('Should show the error and stay open when saving fails', async () => {
    const { injected, mount } = mountSettings()

    injected.update.mockRejectedValue(new Error('Save failed'))

    const component = await mount()

    await submitForm(component)

    expect(component.text()).toContain('Save failed')
    expect(component.emitted('close')).toBeUndefined()
  })

  it('Should show a generic error when the failure has no message', async () => {
    const { injected, mount } = mountSettings()

    injected.update.mockRejectedValue({})

    const component = await mount()

    await submitForm(component)

    expect(component.text()).toContain(
      'An error occurred during updating initiative settings',
    )
  })
})
