function isEncounter(item: CampaignItem | EncounterItem): item is EncounterItem {
  return 'activeIndex' in item
}

export function isOwner(item: CampaignItem | EncounterItem, id: string): boolean {
  return item.created_by.id === id
}

export function isAdmin(item: CampaignItem | EncounterItem, id: string): boolean {
  if (isOwner(item, id)) return true

  const team = isEncounter(item) ? item.campaign.team : item.team

  return !!team?.find(u => u.user.id === id && u.role === 'Admin') || false
}

export function isMember(item: CampaignItem | EncounterItem, id: string): boolean {
  if (isOwner(item, id)) return true

  const team = isEncounter(item) ? item.campaign.team : item.team

  return !!team?.find(u => u.user.id === id) || false
}

export function hasPermission(userRole: UserRole, expected: UserRole): boolean {
  if (
    userRole === 'Owner'
    || userRole === expected
    || (userRole === 'Admin' && expected === 'Viewer')
  ) return true
  else return false
}

export function getRole(item: CampaignItem | EncounterItem, id: string): UserRole {
  if (isOwner(item, id)) return 'Owner'
  else if (isAdmin(item, id)) return 'Admin'
  else return 'Viewer'
}

export function generateToken(length = 32): string {
  const numbers = '0123456789'
  const charsLower = 'abcdefghijklmnopqrstuvwxyz'
  const charsUpper = charsLower.toUpperCase()
  const chars = numbers.concat(charsLower, charsUpper)

  let string = ''
  for (let i = 0; i < length; i++) {
    string += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return string
}
