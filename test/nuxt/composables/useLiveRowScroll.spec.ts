import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useLiveRowScroll } from '~/composables/useLiveRowScroll'

const activeId = ref<string>()

let scroll: ReturnType<typeof useLiveRowScroll>

function createContainer(rect = { top: 0, bottom: 200 }): HTMLElement {
  const element = document.createElement('div')

  element.getBoundingClientRect = () => rect as DOMRect

  return element
}

function createRow(rect: { top: number; bottom: number }): {
  element: HTMLElement
  scrollIntoView: ReturnType<typeof vi.fn>
} {
  const element = document.createElement('div')
  const scrollIntoView = vi.fn()

  element.getBoundingClientRect = () => rect as DOMRect
  element.scrollIntoView = scrollIntoView

  return { element, scrollIntoView }
}

async function setActive(id: string | undefined): Promise<void> {
  activeId.value = id

  await flushPromises()
}

describe('useLiveRowScroll', () => {
  beforeEach(() => {
    activeId.value = undefined
    scroll = useLiveRowScroll(computed(() => activeId.value))
  })

  it('scrolls the active row into view when it sits above the container', async () => {
    const row = createRow({ top: -50, bottom: -10 })

    scroll.listRef.value = createContainer()
    scroll.setRowRef('row-1', row.element)

    await setActive('row-1')

    expect(row.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'nearest',
    })
  })

  it('scrolls the active row into view when it sits below the container', async () => {
    const row = createRow({ top: 260, bottom: 300 })

    scroll.listRef.value = createContainer()
    scroll.setRowRef('row-1', row.element)

    await setActive('row-1')

    expect(row.scrollIntoView).toHaveBeenCalled()
  })

  it('leaves a row that is already in view alone', async () => {
    const row = createRow({ top: 10, bottom: 60 })

    scroll.listRef.value = createContainer()
    scroll.setRowRef('row-1', row.element)

    await setActive('row-1')

    expect(row.scrollIntoView).not.toHaveBeenCalled()
  })

  it('resolves a component ref to its root element', async () => {
    const row = createRow({ top: -50, bottom: -10 })

    scroll.listRef.value = createContainer()
    scroll.setRowRef('row-1', { $el: row.element })

    await setActive('row-1')

    expect(row.scrollIntoView).toHaveBeenCalled()
  })

  it('forgets a row once its ref is released', async () => {
    const row = createRow({ top: -50, bottom: -10 })

    scroll.listRef.value = createContainer()
    scroll.setRowRef('row-1', row.element)
    scroll.setRowRef('row-1', null)

    await setActive('row-1')

    expect(row.scrollIntoView).not.toHaveBeenCalled()
  })

  it('does nothing while the list is not mounted', async () => {
    const row = createRow({ top: -50, bottom: -10 })

    scroll.setRowRef('row-1', row.element)

    await setActive('row-1')

    expect(row.scrollIntoView).not.toHaveBeenCalled()
  })

  it('does nothing when there is no longer an active row', async () => {
    const row = createRow({ top: -50, bottom: -10 })

    scroll.listRef.value = createContainer()
    scroll.setRowRef('row-1', row.element)

    await setActive('row-1')
    row.scrollIntoView.mockClear()

    await setActive(undefined)

    expect(row.scrollIntoView).not.toHaveBeenCalled()
  })

  it('does nothing when the active row was never registered', async () => {
    const row = createRow({ top: -50, bottom: -10 })

    scroll.listRef.value = createContainer()
    scroll.setRowRef('row-1', row.element)

    await setActive('row-2')

    expect(row.scrollIntoView).not.toHaveBeenCalled()
  })
})
