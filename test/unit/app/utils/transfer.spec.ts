import { afterEach, describe, expect, it, vi } from 'vitest'

const row = {
  id: 'row-1',
  index: 0,
  initiative: 12,
  name: 'Goblin',
  type: 'monster',
  conditions: [],
  campaign: 4,
  homebrew: 9,
  hitPoints: 7,
} as InitiativeSheetRow

const encounter = {
  id: 3,
  title: 'Goblin Ambush',
  createdAt: '2026-01-01T00:00:00.000Z',
  round: 2,
  activeIndex: 1,
  version: 5,
  rows: [row],
  info: 'Watch the trees',
  infoCards: [],
  createdBy: { id: '1', username: 'Test User', avatar: 'avatar-url' },
  campaign: { id: 2 },
  settings: { spacing: 'normal', modified: false },
} as unknown as EncounterItem

const homebrew: HomebrewItemRow = {
  id: 1,
  campaign: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  name: 'Goblin Boss',
  type: 'monster',
  player: null,
  link: null,
  actions: [],
  abilityScores: null,
  armorClass: 17,
  armorDetail: null,
  hitDice: null,
  hitPoints: 21,
  initiativeModifier: '2',
  languages: null,
  modifiers: null,
  passivePerception: null,
  proficiencyBonus: null,
  resistancesAndImmunities: null,
  savingThrows: null,
  sight: null,
  skillBonuses: null,
  speed: null,
  traits: null,
}

function fileText(kind: string, items: unknown[], extra = {}): string {
  return JSON.stringify({
    format: 'dnd-tracker',
    kind,
    version: 1,
    exportedAt: '2026-10-16T00:00:00.000Z',
    items,
    ...extra,
  })
}

function reasonOf(run: () => unknown): TransferErrorReason | undefined {
  try {
    run()
  } catch (error) {
    if (error instanceof TransferError) return error.reason
  }
}

describe('transfer', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  describe('toEncounterTransfer', () => {
    it('Should keep only the portable fields of an encounter', () => {
      expect(toEncounterTransfer(encounter)).toEqual({
        title: 'Goblin Ambush',
        info: 'Watch the trees',
        rows: [
          {
            id: 'row-1',
            index: 0,
            initiative: 12,
            name: 'Goblin',
            type: 'monster',
            conditions: [],
            hitPoints: 7,
          },
        ],
        settings: { spacing: 'normal', modified: false },
        infoCards: [],
        round: 2,
        activeIndex: 1,
      })
    })
  })

  describe('toHomebrewTransfer', () => {
    it('Should drop the id, campaign and creation date', () => {
      const result = toHomebrewTransfer(homebrew)

      expect(result).not.toHaveProperty('id')
      expect(result).not.toHaveProperty('campaign')
      expect(result).not.toHaveProperty('createdAt')
      expect(result).toMatchObject({ name: 'Goblin Boss', armorClass: 17 })
    })
  })

  describe('createTransferFile', () => {
    it('Should wrap the items with the format, kind and version', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-10-16T10:00:00.000Z'))

      expect(createTransferFile('homebrews', [])).toEqual({
        format: 'dnd-tracker',
        kind: 'homebrews',
        version: 1,
        exportedAt: '2026-10-16T10:00:00.000Z',
        items: [],
      })
    })
  })

  describe('transferFileName', () => {
    it('Should name the file after the kind and the date', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-10-16T10:00:00.000Z'))

      expect(transferFileName('encounters')).toBe(
        'dnd-tracker-encounters-2026-10-16.json',
      )
    })
  })

  describe('parseTransferFile', () => {
    it('Should read back an exported encounter', () => {
      const items = parseTransferFile(
        fileText('encounters', [toEncounterTransfer(encounter)]),
        'encounters',
      )

      expect(items).toEqual([toEncounterTransfer(encounter)])
    })

    it('Should read back an exported homebrew item', () => {
      const items = parseTransferFile(
        fileText('homebrews', [toHomebrewTransfer(homebrew)]),
        'homebrews',
      )

      expect(items).toEqual([toHomebrewTransfer(homebrew)])
    })

    it('Should strip campaign and homebrew links from imported rows', () => {
      const [item] = parseTransferFile(
        fileText('encounters', [{ title: 'Ambush', rows: [row] }]),
        'encounters',
      )

      expect(item!.rows[0]).not.toHaveProperty('campaign')
      expect(item!.rows[0]).not.toHaveProperty('homebrew')
      expect(item!.rows[0]).toHaveProperty('hitPoints', 7)
    })

    it('Should fill in the encounter defaults', () => {
      const [item] = parseTransferFile(
        fileText('encounters', [{ title: 'Ambush', rows: [] }]),
        'encounters',
      )

      expect(item).toEqual({
        title: 'Ambush',
        rows: [],
        infoCards: [],
        round: 1,
        activeIndex: 0,
      })
    })

    it('Should store a numeric initiative modifier as text', () => {
      const [item] = parseTransferFile(
        fileText('homebrews', [{ name: 'Orc', initiativeModifier: 3 }]),
        'homebrews',
      )

      expect(item).toMatchObject({
        name: 'Orc',
        type: 'player',
        initiativeModifier: '3',
        actions: [],
      })
    })

    it('Should drop unknown homebrew fields', () => {
      const [item] = parseTransferFile(
        fileText('homebrews', [{ name: 'Orc', id: 5, campaign: 3 }]),
        'homebrews',
      )

      expect(item).not.toHaveProperty('id')
      expect(item).not.toHaveProperty('campaign')
    })

    it.each([
      ['text that is not json', 'not json'],
      ['json from another app', JSON.stringify({ hello: 'world' })],
      [
        'an unknown version',
        fileText('encounters', [{ title: 'Ambush', rows: [] }], {
          version: 2,
        }),
      ],
      ['an encounter without rows', fileText('encounters', [{ title: 'A' }])],
      [
        'a row without a name',
        fileText('encounters', [
          { title: 'Ambush', rows: [{ ...row, name: '' }] },
        ]),
      ],
      [
        'an unknown row type',
        fileText('encounters', [
          { title: 'Ambush', rows: [{ ...row, type: 'dragon' }] },
        ]),
      ],
      [
        'a title that is too long',
        fileText('encounters', [{ title: 'a'.repeat(31), rows: [] }]),
      ],
    ])('Should reject %s as an invalid file', (_label, text) => {
      expect(reasonOf(() => parseTransferFile(text, 'encounters'))).toBe(
        'invalidFile',
      )
    })

    it('Should reject a homebrew field with the wrong shape', () => {
      expect(
        reasonOf(() =>
          parseTransferFile(
            fileText('homebrews', [{ name: 'Orc', speed: [30] }]),
            'homebrews',
          ),
        ),
      ).toBe('invalidFile')
    })

    it('Should reject a file of the other kind', () => {
      expect(
        reasonOf(() =>
          parseTransferFile(
            fileText('homebrews', [{ name: 'Orc' }]),
            'encounters',
          ),
        ),
      ).toBe('wrongKind')
    })

    it('Should reject a file without items', () => {
      expect(
        reasonOf(() =>
          parseTransferFile(fileText('homebrews', []), 'homebrews'),
        ),
      ).toBe('empty')
    })
  })

  describe('readTransferFile', () => {
    it('Should parse the text of the file', async () => {
      const file = new File(
        [fileText('homebrews', [{ name: 'Orc' }])],
        'export.json',
      )

      await expect(readTransferFile(file, 'homebrews')).resolves.toEqual([
        expect.objectContaining({ name: 'Orc' }),
      ])
    })

    it('Should reject a file over the size limit before reading it', async () => {
      const file = new File(['x'], 'export.json')

      Object.defineProperty(file, 'size', { value: maxTransferFileSize + 1 })

      await expect(readTransferFile(file, 'homebrews')).rejects.toMatchObject({
        reason: 'tooLarge',
      })
    })
  })

  describe('assertTransferRoom', () => {
    it('Should allow an import that fits', () => {
      expect(() => assertTransferRoom(3, 3)).not.toThrow()
    })

    it('Should report how many items still fit', () => {
      expect(() => assertTransferRoom(4, 3)).toThrow(
        expect.objectContaining({ reason: 'tooMany', count: 3 }),
      )
    })

    it('Should never report a negative room', () => {
      expect(() => assertTransferRoom(1, -2)).toThrow(
        expect.objectContaining({ count: 0 }),
      )
    })
  })
})
