export function isOwner(campaign: CampaignItem, id: string): boolean {
  return campaign.created_by.id === id
}

export function isAdmin(campaign: CampaignItem, id: string): boolean {
  if (isOwner(campaign, id)) return true

  return !!campaign.team?.find(u => u.user.id === id && u.role === 'Admin') || false
}

export function isMember(campaign: CampaignItem, id: string): boolean {
  if (isOwner(campaign, id)) return true

  return !!campaign.team?.find(u => u.user.id === id) || false
}

export function hasPermission(userRole: UserRole, expected: UserRole): boolean {
  if (
    userRole === 'Owner'
    || userRole === expected
    || (userRole === 'Admin' && expected === 'Viewer')
  ) return true
  else return false
}

export function getRole(campaign: CampaignItem, id: string): UserRole {
  if (isOwner(campaign, id)) return 'Owner'
  else if (isAdmin(campaign, id)) return 'Admin'
  else return 'Viewer'
}
