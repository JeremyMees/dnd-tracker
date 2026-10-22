export function escapeLikePattern(value: string): string {
  return value.replace(/([\\%_])/g, String.raw`\$1`)
}
