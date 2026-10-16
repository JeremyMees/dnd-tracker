import { describe, expect, it } from 'vitest'

describe('csv', () => {
  describe('parseCsvRows', () => {
    it('Should split rows and fields', () => {
      expect(parseCsvRows('a,b\n1,2')).toEqual([
        ['a', 'b'],
        ['1', '2'],
      ])
    })

    it('Should keep commas, quotes and new lines inside quoted fields', () => {
      expect(parseCsvRows('"a, b","say ""hi""","two\nlines"')).toEqual([
        ['a, b', 'say "hi"', 'two\nlines'],
      ])
    })

    it('Should read windows line endings and skip blank rows', () => {
      expect(parseCsvRows('a,b\r\n\r\n1,2\r\n')).toEqual([
        ['a', 'b'],
        ['1', '2'],
      ])
    })

    it('Should keep empty fields', () => {
      expect(parseCsvRows('a,,c')).toEqual([['a', '', 'c']])
    })
  })

  describe('parseCsv', () => {
    it('Should map rows to the lowercase header names', () => {
      expect(parseCsv('\uFEFFName, HP\nGoblin, 7\nOrc')).toEqual([
        { name: 'Goblin', hp: '7' },
        { name: 'Orc', hp: '' },
      ])
    })

    it('Should return nothing for empty text', () => {
      expect(parseCsv('')).toEqual([])
    })
  })
})
