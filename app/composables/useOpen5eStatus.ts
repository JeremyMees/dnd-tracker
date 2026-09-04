export function useOpen5eStatus() {
  const staleSince = useState<string | null>('open5e-stale-since', () => null)

  const isStale = computed<boolean>(() => staleSince.value !== null)

  function trackOpen5eFreshness(staleAt: string | null | undefined): void {
    staleSince.value = staleAt ?? null
  }

  return { staleSince, isStale, trackOpen5eFreshness }
}
