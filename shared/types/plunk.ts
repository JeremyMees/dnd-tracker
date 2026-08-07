export interface PlunkContact {
  id: string
  email: string
}

export interface PlunkSentEmail {
  contact: PlunkContact
  email: string
}

export interface PlunkSendResponse {
  success: boolean
  data: {
    emails: PlunkSentEmail[]
    timestamp: string
  }
}
