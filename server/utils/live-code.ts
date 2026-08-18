const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 6

export function generateLiveCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH))

  return Array.from(
    bytes,
    byte => CODE_ALPHABET[byte % CODE_ALPHABET.length],
  ).join('')
}
