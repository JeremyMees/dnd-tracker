import type { VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Tooltip from '~/components/atoms/Tooltip.vue'
import { hoverTooltip, mountWithTooltips } from '~~/test/nuxt/stubs/tooltip'

let component: VueWrapper | undefined

async function openTooltip(props: Record<string, unknown>) {
  component = await mountWithTooltips(Tooltip, {
    props,
    slots: { default: () => h('button', { 'test-id': 'trigger' }) },
  })

  await hoverTooltip(component.find('[test-id="trigger"]'))
  await vi.waitFor(() => {
    expect(document.body.querySelector('[role="tooltip"]')).not.toBeNull()
  })
}

function shortcutKeys(): string[] {
  return [
    ...document.body.querySelectorAll('[test-id="tooltip-shortcut"] kbd'),
  ].map(key => key.textContent?.trim() ?? '')
}

describe('Tooltip', () => {
  afterEach(() => {
    component?.unmount()
    component = undefined
  })

  it('Should show only the text without a shortcut', async () => {
    await openTooltip({ text: 'Next' })

    expect(document.body.querySelector('[role="tooltip"]')?.textContent).toBe(
      'Next',
    )
    expect(shortcutKeys()).toEqual([])
  })

  it('Should show the shortcut keys next to the text', async () => {
    await openTooltip({ text: 'Next', shortcut: ['SHIFT', '→'] })

    expect(
      document.body.querySelector('[role="tooltip"]')?.textContent,
    ).toContain('Next')
    expect(shortcutKeys()).toEqual(['Shift', '→'])
  })

  it('Should show the modifier key for the platform', async () => {
    await openTooltip({ text: 'Search', shortcut: ['MOD', 'K'] })

    const modifier = /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘' : 'Ctrl'

    expect(shortcutKeys()).toEqual([modifier, 'K'])
  })
})
