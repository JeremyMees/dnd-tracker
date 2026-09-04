export function useLiveSummary() {
  const stats = useState<CombatStats | undefined>(
    'live-summary-stats',
    () => undefined,
  )
  const open = useState<boolean>('live-summary-open', () => false)

  function show(next: CombatStats): void {
    stats.value = next
    open.value = true
  }

  function dismiss(): void {
    open.value = false
  }

  function clear(): void {
    stats.value = undefined
    open.value = false
  }

  return { stats, open, show, dismiss, clear }
}
