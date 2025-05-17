import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  campaignUrl,
  encounterUrl,
  shareEncounterUrl,
  generateParams,
  slugify,
} from '~/utils/url-generators'

vi.mock('#app', () => ({
  useRuntimeConfig: () => ({ public: { appDomain: 'https://example.com' } }),
}))

describe('url-generators', () => {
  describe('campaignUrl', () => {
    it('should generate a campaign URL', () => {
      const campaign = { id: 1, title: 'My Campaign' }
      const url = campaignUrl(campaign, 'encounters')

      expect(url).toBe('/campaigns/1-my-campaign/encounters')
    })

    it('should handle special characters in campaign title', () => {
      const campaign = { id: 2, title: 'My & Special! Campaign?' }
      const url = campaignUrl(campaign, 'notes')

      expect(url).toBe('/campaigns/2-my-special-campaign/notes')
    })

    it('should handle empty campaign title', () => {
      const campaign = { id: 3, title: '' }
      const url = campaignUrl(campaign, 'settings')

      expect(url).toBe('/campaigns/3-campaign/settings')
    })
  })

  describe('encounterUrl', () => {
    it('should generate an encounter URL', () => {
      const encounter = {
        id: 1,
        title: 'Dragon Battle',
        created_by: 'user1',
      }
      const url = encounterUrl(encounter as any)

      expect(url).toBe('/encounters/1-dragon-battle')
    })

    it('should handle special characters in encounter title', () => {
      const encounter = {
        id: 2,
        title: 'Goblins & Trolls!',
        created_by: 'user1',
      }
      const url = encounterUrl(encounter as any)

      expect(url).toBe('/encounters/2-goblins-trolls')
    })

    it('should handle empty encounter title', () => {
      const encounter = {
        id: 3,
        title: '',
        created_by: 'user1',
      }
      const url = encounterUrl(encounter as any)

      expect(url).toBe('/encounters/3-encounter')
    })
  })

  describe('shareEncounterUrl', () => {
    afterEach(() => {
      vi.clearAllMocks()
    })

    it('should generate a share URL with English locale', () => {
      const url = shareEncounterUrl('abc123', 'en')

      expect(url).toBe('/en/playground?token=abc123')
    })

    it('should generate a share URL with Dutch locale', () => {
      const url = shareEncounterUrl('xyz789', 'nl')

      expect(url).toBe('/playground?token=xyz789')
    })
  })

  describe('generateParams', () => {
    it('should generate parameter string from object', () => {
      const params = { limit: 10, offset: 20, filter: 'active' }
      const result = generateParams(params)

      expect(result).toBe('limit=10&offset=20&filter=active')
    })

    it('should handle empty object', () => {
      const params = {}
      const result = generateParams(params)

      expect(result).toBe('')
    })

    it('should handle boolean and numeric values', () => {
      const params = { enabled: true, count: 5, visible: false }
      const result = generateParams(params)

      expect(result).toBe('enabled=true&count=5&visible=false')
    })
  })

  describe('slugify', () => {
    it('should convert string to lowercase', () => {
      expect(slugify('HELLO WORLD')).toBe('hello-world')
    })

    it('should replace spaces with dashes', () => {
      expect(slugify('hello world')).toBe('hello-world')
    })

    it('should replace special characters with dashes', () => {
      expect(slugify('hello@world!')).toBe('hello-world')
    })

    it('should remove trailing dashes', () => {
      expect(slugify('hello world!')).toBe('hello-world')
    })

    it('should handle multiple special characters in a row', () => {
      expect(slugify('hello & @ # world')).toBe('hello-world')
    })

    it('should handle empty strings', () => {
      expect(slugify('')).toBe('')
    })

    it('should handle strings with only special characters', () => {
      expect(slugify('!@#$%^&*()')).toBe('')
    })
  })
})
