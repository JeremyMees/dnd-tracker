type Campaign = CampaignItem | CampaignFull | CampaignMinimal
type Encounter = EncounterItem

export const isOwner = (item: Campaign | Encounter, id: string) => item.created_by.id === id
export const isAdmin = (item: TeamMember[], id: string) => !!item.find(u => u.user.id === id && u.role === 'Admin')
export const isMember = (item: TeamMember[], id: string) => !!item.find(u => u.user.id === id)

export const isNotCampaignOwner = defineAbility((user: AuthUser, campaign: Campaign) => {
  return !isOwner(campaign, user.id)
})

export const isCampaignOwner = defineAbility((user: AuthUser, campaign: Campaign) => {
  return isOwner(campaign, user.id)
})

export const isCampaignAdmin = defineAbility((user: AuthUser, campaign: Campaign, strict = false) => {
  const owner = isOwner(campaign, user.id)
  const admin = isAdmin(campaign.team, user.id)

  return strict ? admin && !owner : admin || owner
})

export const isCampaignMember = defineAbility((user: AuthUser, campaign: Campaign, strict = false) => {
  const owner = isOwner(campaign, user.id)
  const admin = isAdmin(campaign.team, user.id)
  const member = isMember(campaign.team, user.id)

  return strict ? member && !owner && !admin : member || admin || owner
})

export const isEncounterOwner = defineAbility((user: AuthUser, encounter: Encounter) => {
  return isOwner(encounter, user.id)
})

export const isEncounterAdmin = defineAbility((user: AuthUser, encounter: Encounter, strict = false) => {
  const owner = isOwner(encounter, user.id)
  const admin = isAdmin(encounter.campaign?.team || [], user.id)

  return strict ? admin && !owner : admin || owner
})

export const isEncounterMember = defineAbility((user: AuthUser, encounter: Encounter, strict = false) => {
  const owner = isOwner(encounter, user.id)
  const admin = isAdmin(encounter.campaign?.team || [], user.id)
  const member = isMember(encounter.campaign?.team || [], user.id)

  return strict ? member && !owner && !admin : member || admin || owner
})

export const canUpdateEncounter = defineAbility((user: AuthUser, encounter: Encounter) => {
  const owner = isOwner(encounter, user.id)
  const admin = isAdmin(encounter.campaign?.team || [], user.id)
  const member = isMember(encounter.campaign?.team || [], user.id)

  if (admin) return true
  else if (owner && !member) return true
  else return false
})
