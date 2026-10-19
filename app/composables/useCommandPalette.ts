export function useCommandPalette() {
  const open = useState<boolean>('command-palette-open', () => false)

  return { open }
}
