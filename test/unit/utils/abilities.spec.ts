import { describe, expect, it } from 'vitest'
import { isOwner, isAdmin, isMember } from '~~/shared/utils/abilities'

describe('abilities', () => {
  const userId = 'user-123'
  const otherUserId = 'other-456'

  const mockCampaign = {
    id: 1,
    title: 'Test Campaign',
    created_by: {
      id: userId,
      avatar: 'avatar.png',
      username: 'testuser',
    },
    team: [
      {
        id: 1,
        role: 'Admin',
        user: {
          id: 'admin-789',
          avatar: 'avatar.png',
          username: 'adminuser',
        },
      },
      {
        id: 2,
        role: 'Player',
        user: {
          id: 'member-101',
          avatar: 'avatar.png',
          username: 'memberuser',
        },
      },
    ],
  }

  const mockEncounter = {
    id: 1,
    title: 'Test Encounter',
    created_by: {
      id: userId,
      avatar: 'avatar.png',
      username: 'testuser',
    },
    campaign: mockCampaign,
  }

  describe('isOwner', () => {
    it('should return true if the user is the owner of the item', () => {
      expect(isOwner(mockCampaign as any, userId)).toBe(true)
      expect(isOwner(mockEncounter as any, userId)).toBe(true)
    })

    it('should return false if the user is not the owner of the item', () => {
      expect(isOwner(mockCampaign as any, otherUserId)).toBe(false)
      expect(isOwner(mockEncounter as any, otherUserId)).toBe(false)
    })
  })

  describe('isAdmin', () => {
    it('should return true if the user is an admin in the team', () => {
      expect(isAdmin(mockCampaign.team as TeamMember[], 'admin-789')).toBe(true)
    })

    it('should return false if the user is not an admin in the team', () => {
      expect(isAdmin(mockCampaign.team as TeamMember[], 'member-101')).toBe(false)
      expect(isAdmin(mockCampaign.team as TeamMember[], userId)).toBe(false)
    })
  })

  describe('isMember', () => {
    it('should return true if the user is a member in the team', () => {
      expect(isMember(mockCampaign.team as TeamMember[], 'admin-789')).toBe(true)
      expect(isMember(mockCampaign.team as TeamMember[], 'member-101')).toBe(true)
    })

    it('should return false if the user is not a member in the team', () => {
      expect(isMember(mockCampaign.team as TeamMember[], userId)).toBe(false)
    })
  })
})
