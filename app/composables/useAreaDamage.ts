export function useAreaDamage() {
  const open = useState<boolean>('area-damage-open', () => false)
  const prefill = useState<AreaDamagePrefill | undefined>(
    'area-damage-prefill',
    () => undefined,
  )

  function show(next?: AreaDamagePrefill): void {
    prefill.value = next
    open.value = true
  }

  return { open, prefill, show }
}
