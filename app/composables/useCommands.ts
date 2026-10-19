const registry = shallowRef<Map<symbol, () => PaletteCommand[]>>(new Map())

export function useCommands(commands: MaybeRefOrGetter<PaletteCommand[]>) {
  const key = Symbol('commands')

  onMounted(() => {
    registry.value = new Map(registry.value).set(key, () => toValue(commands))
  })

  onScopeDispose(() => {
    if (!registry.value.has(key)) return

    const next = new Map(registry.value)

    next.delete(key)
    registry.value = next
  })
}

export function useRegisteredCommands() {
  return computed(() =>
    [...registry.value.values()]
      .flatMap(commands => commands())
      .filter(command => !command.disabled),
  )
}
