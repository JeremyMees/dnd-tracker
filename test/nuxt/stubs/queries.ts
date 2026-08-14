export function touchArgs(...args: unknown[]): void {
  for (const arg of args) {
    if (arg && typeof arg === 'object' && 'value' in arg) {
      void (arg as { value: unknown }).value
    }
  }
}
