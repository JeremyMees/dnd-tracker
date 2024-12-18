type PermissionItem = CampaignItem | CampaignFull | CampaignMinimal | EncounterItem

function isEncounter(item: PermissionItem): item is EncounterItem {
  return 'activeIndex' in item
}

export function isOwner(
  item: PermissionItem,
  id: string,
  strict?: boolean,
): boolean {
  const team = isEncounter(item) ? item.campaign?.team || [] : item.team
  const isMember = !!team?.find(u => u.user.id === id)
  const isOwner = item.created_by.id === id

  if (strict && isMember && isOwner) return false
  else return isOwner
}

export function isAdmin(
  item: PermissionItem,
  id: string,
  strict?: boolean,
): boolean {
  if (isOwner(item, id, strict)) return true

  const team = isEncounter(item) ? item.campaign?.team || [] : item.team

  return !!team?.find(u => u.user.id === id && u.role === 'Admin') || false
}

export function isMember(
  item: PermissionItem,
  id: string,
  strict?: boolean,
): boolean {
  if (isOwner(item, id, strict)) return true

  const team = isEncounter(item) ? item.campaign?.team || [] : item.team

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

export function getRole(
  item: PermissionItem,
  id: string,
  strict?: boolean,
): UserRole {
  if (isOwner(item, id, strict)) return 'Owner'
  else if (isAdmin(item, id, strict)) return 'Admin'
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
