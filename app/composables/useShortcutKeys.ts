const keyLabels: Record<string, { mac: string; other: string }> = {
  MOD: { mac: '⌘', other: 'Ctrl' },
  SHIFT: { mac: 'Shift', other: 'Shift' },
  ENTER: { mac: '⏎', other: 'Enter' },
}

export function useShortcutKeys() {
  const isMac = ref<boolean>(false)

  onMounted(() => {
    isMac.value = /Mac|iPhone|iPad/.test(navigator.userAgent)
  })

  function keyLabel(key: string): string {
    const label = keyLabels[key]

    if (!label) return key

    return isMac.value ? label.mac : label.other
  }

  return { keyLabel }
}
