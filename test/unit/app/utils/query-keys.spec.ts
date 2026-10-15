import { describe, expect, it } from 'vitest'

describe('queryKeys', () => {
  it('builds a key from the query name and its params', () => {
    expect(queryKeys.campaignDetail(4)).toEqual(['useCampaignDetail', 4])
    expect(queryKeys.noteListing({ page: 1 }, 10)).toEqual([
      'useNoteListing',
      { page: 1 },
      10,
    ])
  })

  it('leaves out params that are not given so the key matches every variant', () => {
    expect(queryKeys.noteListing()).toEqual(['useNoteListing'])
    expect(queryKeys.noteCount()).toEqual(['useNoteCount'])
    expect(queryKeys.campaignCount()).toEqual(['useCampaignCount'])
  })

  it('keeps an undefined param when a later param is given', () => {
    expect(queryKeys.homebrewListing(undefined, 10)).toEqual([
      'useHomebrewListing',
      undefined,
      10,
    ])
  })

  it('wraps the member lookup email in an object', () => {
    expect(queryKeys.campaignMemberLookup('a@b.c')).toEqual([
      'useCampaignMemberLookup',
      { email: 'a@b.c' },
    ])
  })

  it('always keeps both live state tokens, even when missing', () => {
    expect(queryKeys.liveState('token', 'seat-token')).toEqual([
      'useLiveState',
      'token',
      'seat-token',
    ])
    expect(queryKeys.liveState(undefined, undefined)).toEqual([
      'useLiveState',
      undefined,
      undefined,
    ])
  })
})
