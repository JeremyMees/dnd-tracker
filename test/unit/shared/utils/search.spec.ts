import { describe, expect, it } from 'vitest'

describe('escapeLikePattern', () => {
  it('leaves an address with no metacharacters untouched', () => {
    expect(escapeLikePattern('bilbo@shire.com')).toBe('bilbo@shire.com')
  })

  it('escapes the single character wildcard', () => {
    expect(escapeLikePattern('a_b@shire.com')).toBe('a\\_b@shire.com')
  })

  it('escapes the multi character wildcard', () => {
    expect(escapeLikePattern('a%b')).toBe('a\\%b')
  })

  it('escapes a literal backslash', () => {
    expect(escapeLikePattern('a\\b')).toBe('a\\\\b')
  })

  it('escapes every occurrence rather than only the first', () => {
    expect(escapeLikePattern('_a_b_')).toBe('\\_a\\_b\\_')
    expect(escapeLikePattern('%a%b%')).toBe('\\%a\\%b\\%')
  })

  it('escapes a backslash that already precedes a wildcard', () => {
    expect(escapeLikePattern('a\\_b')).toBe('a\\\\\\_b')
  })

  it('escapes mixed metacharacters in one pass', () => {
    expect(escapeLikePattern('a_b%c\\d')).toBe('a\\_b\\%c\\\\d')
  })

  it('returns an empty string for empty input', () => {
    expect(escapeLikePattern('')).toBe('')
  })

  it('neutralises an address that would otherwise match a sibling', () => {
    const pattern = escapeLikePattern('first_last@shire.com')

    expect(pattern).not.toMatch(/(^|[^\\])_/)
    expect(pattern).toBe('first\\_last@shire.com')
  })
})
