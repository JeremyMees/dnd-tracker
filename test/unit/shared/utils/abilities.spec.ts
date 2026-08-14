import { describe, expect, it } from 'vitest'
import {
  isOwner,
  isAdmin,
  isMember,
  isNotCampaignOwner,
  isCampaignOwner,
  isCampaignAdmin,
  isCampaignMember,
  isEncounterOwner,
  isEncounterAdmin,
  isEncounterMember,
  canUpdateEncounter,
} from '~~/shared/utils/abilities'

describe('abilities', () => {
  const userId = 'user-123'
  const otherUserId = 'other-456'
  const adminId = 'admin-789'
  const memberId = 'member-101'

  const user = { id: userId } as AuthUser
  const otherUser = { id: otherUserId } as AuthUser
  const adminUser = { id: adminId } as AuthUser
  const memberUser = { id: memberId } as AuthUser

  const mockCampaign: CampaignMinimal = {
    id: 1,
    title: 'Test Campaign',
    createdBy: {
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
    createdBy: {
      id: userId,
      avatar: 'avatar.png',
      username: 'testuser',
    },
    campaign: mockCampaign,
  }

  describe('isOwner', () => {
    it('should return true if the user is the owner of the item', () => {
      expect(isOwner(mockCampaign, userId)).toBeTruthy()
      expect(
        isOwner(mockEncounter as unknown as EncounterItem, userId),
      ).toBeTruthy()
    })

    it('should return false if the user is not the owner of the item', () => {
      expect(isOwner(mockCampaign, otherUserId)).toBeFalsy()
      expect(
        isOwner(mockEncounter as unknown as EncounterItem, otherUserId),
      ).toBeFalsy()
    })
  })

  describe('isAdmin', () => {
    it('should return true if the user is an admin in the team', () => {
      expect(
        isAdmin(mockCampaign.team as TeamMember[], 'admin-789'),
      ).toBeTruthy()
    })

    it('should return false if the user is not an admin in the team', () => {
      expect(
        isAdmin(mockCampaign.team as TeamMember[], 'member-101'),
      ).toBeFalsy()
      expect(isAdmin(mockCampaign.team as TeamMember[], userId)).toBeFalsy()
    })
  })

  describe('isMember', () => {
    it('should return true if the user is a member in the team', () => {
      expect(
        isMember(mockCampaign.team as TeamMember[], 'admin-789'),
      ).toBeTruthy()
      expect(
        isMember(mockCampaign.team as TeamMember[], 'member-101'),
      ).toBeTruthy()
    })

    it('should return false if the user is not a member in the team', () => {
      expect(isMember(mockCampaign.team as TeamMember[], userId)).toBeFalsy()
    })
  })

  describe('isNotCampaignOwner', () => {
    it('should return false when the user owns the campaign', () => {
      expect(isNotCampaignOwner.original(user, mockCampaign)).toBeFalsy()
    })

    it('should return true when the user does not own the campaign', () => {
      expect(isNotCampaignOwner.original(otherUser, mockCampaign)).toBeTruthy()
    })
  })

  describe('isCampaignOwner', () => {
    it('should return true when the user owns the campaign', () => {
      expect(isCampaignOwner.original(user, mockCampaign)).toBeTruthy()
    })

    it('should return false when the user does not own the campaign', () => {
      expect(isCampaignOwner.original(otherUser, mockCampaign)).toBeFalsy()
    })
  })

  describe('isCampaignAdmin', () => {
    it('should return true for the owner in non-strict mode (default arg)', () => {
      expect(isCampaignAdmin.original(user, mockCampaign)).toBeTruthy()
    })

    it('should return true for an admin in non-strict mode', () => {
      expect(isCampaignAdmin.original(adminUser, mockCampaign)).toBeTruthy()
    })

    it('should return false for the owner in strict mode', () => {
      expect(isCampaignAdmin.original(user, mockCampaign, true)).toBeFalsy()
    })

    it('should return true for an admin who is not the owner in strict mode', () => {
      expect(
        isCampaignAdmin.original(adminUser, mockCampaign, true),
      ).toBeTruthy()
    })

    it('should return false for a user who is neither owner nor admin', () => {
      expect(isCampaignAdmin.original(otherUser, mockCampaign)).toBeFalsy()
    })
  })

  describe('isCampaignMember', () => {
    it('should return true for a member in non-strict mode (default arg)', () => {
      expect(isCampaignMember.original(memberUser, mockCampaign)).toBeTruthy()
    })

    it('should return true for the owner in non-strict mode', () => {
      expect(isCampaignMember.original(user, mockCampaign)).toBeTruthy()
    })

    it('should return true for a member who is not owner or admin in strict mode', () => {
      expect(
        isCampaignMember.original(memberUser, mockCampaign, true),
      ).toBeTruthy()
    })

    it('should return false for the owner in strict mode', () => {
      expect(isCampaignMember.original(user, mockCampaign, true)).toBeFalsy()
    })

    it('should return false for a user with no relation to the campaign', () => {
      expect(isCampaignMember.original(otherUser, mockCampaign)).toBeFalsy()
    })
  })

  describe('isEncounterOwner', () => {
    it('should return true when the user owns the encounter', () => {
      expect(
        isEncounterOwner.original(user, mockEncounter as EncounterItem),
      ).toBeTruthy()
    })

    it('should return false when the user does not own the encounter', () => {
      expect(
        isEncounterOwner.original(otherUser, mockEncounter as EncounterItem),
      ).toBeFalsy()
    })
  })

  describe('isEncounterAdmin', () => {
    it('should return true for the owner in non-strict mode (default arg)', () => {
      expect(
        isEncounterAdmin.original(user, mockEncounter as EncounterItem),
      ).toBeTruthy()
    })

    it('should return true for a campaign admin in non-strict mode', () => {
      expect(
        isEncounterAdmin.original(adminUser, mockEncounter as EncounterItem),
      ).toBeTruthy()
    })

    it('should return false for the owner in strict mode', () => {
      expect(
        isEncounterAdmin.original(user, mockEncounter as EncounterItem, true),
      ).toBeFalsy()
    })

    it('should fall back to an empty team when the encounter has no campaign', () => {
      const encounterNoCampaign = {
        ...mockEncounter,
        campaign: undefined,
      } as unknown as EncounterItem

      expect(isEncounterAdmin.original(user, encounterNoCampaign)).toBeTruthy()
      expect(
        isEncounterAdmin.original(otherUser, encounterNoCampaign),
      ).toBeFalsy()
    })
  })

  describe('isEncounterMember', () => {
    it('should return true for a campaign member in non-strict mode (default arg)', () => {
      expect(
        isEncounterMember.original(memberUser, mockEncounter as EncounterItem),
      ).toBeTruthy()
    })

    it('should return true for a member who is not owner or admin in strict mode', () => {
      expect(
        isEncounterMember.original(
          memberUser,
          mockEncounter as EncounterItem,
          true,
        ),
      ).toBeTruthy()
    })

    it('should return false for the owner in strict mode', () => {
      expect(
        isEncounterMember.original(user, mockEncounter as EncounterItem, true),
      ).toBeFalsy()
    })

    it('should return false for a user with no relation to the encounter', () => {
      expect(
        isEncounterMember.original(otherUser, mockEncounter as EncounterItem),
      ).toBeFalsy()
    })
  })

  describe('canUpdateEncounter', () => {
    it('should return true for a campaign admin (default arg)', () => {
      expect(
        canUpdateEncounter.original(adminUser, mockEncounter as EncounterItem),
      ).toBeTruthy()
    })

    it('should return true for the owner when they are not a campaign member', () => {
      expect(
        canUpdateEncounter.original(user, mockEncounter as EncounterItem),
      ).toBeTruthy()
    })

    it('should return false for the owner when they are also a campaign member', () => {
      const encounterOwnedByMember = {
        ...mockEncounter,
        createdBy: { ...mockEncounter.createdBy, id: memberId },
      } as unknown as EncounterItem

      expect(
        canUpdateEncounter.original(memberUser, encounterOwnedByMember),
      ).toBeFalsy()
    })

    it('should return false for a user with no relation to the encounter', () => {
      expect(
        canUpdateEncounter.original(otherUser, mockEncounter as EncounterItem),
      ).toBeFalsy()
    })

    it('should check the campaign owner when isCampaign is true', () => {
      expect(
        canUpdateEncounter.original(user, mockEncounter as EncounterItem, true),
      ).toBeTruthy()
    })
  })
})
