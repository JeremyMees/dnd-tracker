export function useLiveRowScroll(activeId: ComputedRef<string | undefined>) {
  const listRef = ref<HTMLElement>()
  const rowRefs = new Map<string, HTMLElement>()

  function setRowRef(id: string, el: unknown): void {
    const node = (el as { $el?: unknown } | null)?.$el ?? el

    if (node instanceof HTMLElement) rowRefs.set(id, node)
    else rowRefs.delete(id)
  }

  function scrollActiveIntoView(): void {
    const container = listRef.value
    const id = activeId.value

    if (!container || !id) return

    const el = rowRefs.get(id)

    if (!el) return

    const containerRect = container.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const inView =
      elRect.top >= containerRect.top && elRect.bottom <= containerRect.bottom

    if (!inView) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  watch(activeId, () => nextTick(scrollActiveIntoView))

  return { listRef, setRowRef }
}
