import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, afterEach } from 'vitest'
import Dragon from '~/components/atoms/Dragon.vue'

describe('Dragon', async () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(Dragon)

    expect(component.html()).toMatchSnapshot()
  })

  it('Should set a rotate transform on the eyes when calculateEyes is called', async () => {
    const component = await mountSuspended(Dragon)

    const eyeLeft = component.find('.absolute.top-\\[55\\%\\].left-\\[54\\%\\]')
      .element as HTMLElement
    const eyeRight = component.find(
      '.absolute.top-\\[55\\%\\].right-\\[61\\%\\]',
    ).element as HTMLElement

    ;(
      component.vm as unknown as { calculateEyes: (e: MouseEvent) => void }
    ).calculateEyes({ clientX: 100, clientY: 200 } as MouseEvent)

    expect(eyeLeft.style.transform).toMatch(/^rotate\(-?\d+(\.\d+)?deg\)$/)
    expect(eyeRight.style.transform).toMatch(/^rotate\(-?\d+(\.\d+)?deg\)$/)
  })
})
