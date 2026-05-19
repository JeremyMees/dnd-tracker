import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, afterEach } from 'vitest'
import Modal from '~/components/atoms/Modal.vue'
import { DialogContent } from '~/components/ui/dialog'

describe('Modal', async () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(Modal, {
      props: {
        header: 'Test Header',
        subHeader: 'Test Sub Header',
      },
    })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should have correct default props', async () => {
    const component = await mountSuspended(Modal)

    expect(component.props('variant')).toBe('default')
    expect(component.props('header')).toBe('')
    expect(component.props('subHeader')).toBe('')
  })

  it('Should accept header prop', async () => {
    const component = await mountSuspended(Modal, {
      props: {
        header: 'Test Header',
      },
    })

    expect(component.props('header')).toBe('Test Header')
  })

  it('Should accept subHeader prop', async () => {
    const component = await mountSuspended(Modal, {
      props: {
        subHeader: 'Test Sub Header',
      },
    })

    expect(component.props('subHeader')).toBe('Test Sub Header')
  })

  it('Should use default variant when no variant is set', async () => {
    const component = await mountSuspended(Modal, {
      props: {},
    })

    expect(component.props('variant')).toBe('default')
  })

  it('Should accept default variant', async () => {
    const component = await mountSuspended(Modal, {
      props: {
        variant: 'default',
      },
    })

    expect(component.props('variant')).toBe('default')
  })

  it('Should accept big variant', async () => {
    const component = await mountSuspended(Modal, {
      props: {
        variant: 'big',
      },
    })

    expect(component.props('variant')).toBe('big')
  })

  it('Should accept fullScreen variant', async () => {
    const component = await mountSuspended(Modal, {
      props: {
        variant: 'fullScreen',
      },
    })

    expect(component.props('variant')).toBe('fullScreen')
  })

  it('Should emit close event on escape key down', async () => {
    const component = await mountSuspended(Modal, {
      props: {
        header: 'Test Header',
      },
    })

    const dialogContent = component.findComponent(DialogContent)
    await dialogContent.vm.$emit('escapeKeyDown')

    expect(component.emitted('close')).toBeTruthy()
  })

  it('Should emit close event on pointer down outside', async () => {
    const component = await mountSuspended(Modal, {
      props: {
        header: 'Test Header',
      },
    })

    const dialogContent = component.findComponent(DialogContent)
    await dialogContent.vm.$emit('pointerDownOutside')

    expect(component.emitted('close')).toBeTruthy()
  })

  it('Should emit close event on interact outside', async () => {
    const component = await mountSuspended(Modal, {
      props: {
        header: 'Test Header',
      },
    })

    const dialogContent = component.findComponent(DialogContent)
    await dialogContent.vm.$emit('interactOutside')

    expect(component.emitted('close')).toBeTruthy()
  })

  it('Should emit close event on close button click', async () => {
    const component = await mountSuspended(Modal, {
      props: {
        header: 'Test Header',
      },
    })

    const dialogContent = component.findComponent(DialogContent)
    await dialogContent.vm.$emit('close')

    expect(component.emitted('close')).toBeTruthy()
  })
})
