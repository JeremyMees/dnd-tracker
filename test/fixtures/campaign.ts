export const mockSheetCampaign: InitiativeSheet['campaign'] = {
  id: 1,
  title: 'Test Campaign',
  createdBy: {
    id: '1',
    username: 'Test User',
    avatar: 'avatar-url',
  },
  team: [],
}

export const mockCampaignItem: CampaignItem = {
  id: 1,
  title: 'Test Campaign',
  createdAt: '2026-01-01T00:00:00.000Z',
  createdBy: {
    id: '1',
    username: 'Test User',
    avatar: 'avatar-url',
  },
  team: [],
  initiative_sheets: 2,
  homebrew_items: 3,
}

export const mockTeamMember: TeamMemberFull = {
  id: 5,
  role: 'Player',
  user: {
    id: '2',
    username: 'Team Member',
    avatar: 'avatar-url',
    name: 'Team Member',
    email: 'team.member@example.com',
    subscriptionType: 'free',
  },
}

export const mockInvitedMember: TeamMemberFull = {
  id: 6,
  role: 'Admin',
  user: {
    id: '3',
    username: 'Invited User',
    avatar: 'avatar-url',
    name: 'Invited User',
    email: 'invited.user@example.com',
    subscriptionType: 'free',
  },
}

export const mockCampaignFull: CampaignFull = {
  id: 1,
  title: 'Test Campaign',
  createdBy: {
    id: '1',
    username: 'Test User',
    avatar: 'avatar-url',
    name: 'Test User',
    email: 'test.user@example.com',
  },
  team: [],
  join_campaign: [],
}

export const campaignPageProps = {
  current: mockCampaignFull,
  campaignId: mockCampaignFull.id,
  isAdmin: false,
  isOwner: false,
  fetchReady: true,
}
