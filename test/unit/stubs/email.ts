import { mockStorage, setStorageItem } from './storage'

const templates: Record<EmailTemplate, string> = {
  CampaignInvite:
    'username={{ username }}\ncampaign={{ campaign }}\ninvitedBy={{ invitedBy }}\ninviteLink={{ inviteLink }}',
  CampaignInviteNoUser: 'campaign={{ campaign }}\ninvitedBy={{ invitedBy }}',
  ContactRequest:
    'date={{ date }}\nemail={{ email }}\n{{#name}}name={{ name }}\n{{/name}}question={{ question }}',
  FeatureRequest:
    'date={{ date }}\nemail={{ email }}\nname={{ name }}\ntitle={{ title }}\ntext={{ text }}',
  ShareNote:
    'sharedBy={{ sharedBy }}\ncampaign={{ campaign }}\nnoteTitle={{ noteTitle }}\nnoteContent={{{ noteContent }}}',
}

export function mockEmailTemplates() {
  mockStorage()

  for (const [template, body] of Object.entries(templates)) {
    setStorageItem(`emails:${template}.html`, `<html>${body}</html>`)
    setStorageItem(`emails:${template}.txt`, body)
  }
}
