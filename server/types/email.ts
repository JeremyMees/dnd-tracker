export type EmailValues = {
  CampaignInvite: {
    username: string
    campaign: string
    invitedBy: string
    inviteLink: string
  }
  CampaignInviteNoUser: { campaign: string; invitedBy: string }
  ContactRequest: {
    date: string
    email: string
    name?: string
    question: string
  }
  FeatureRequest: {
    date: string
    email: string
    name: string
    title: string
    text: string
  }
  ShareNote: {
    sharedBy: string
    campaign: string
    noteTitle: string
    noteContent: string
  }
}

export type EmailTemplate = keyof EmailValues
