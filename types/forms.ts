import type { FormKitNode } from '@formkit/core'

export type FormNode = FormKitNode

export interface Login {
  email: string
  password: string
}

export interface Register extends Login {
  username: string
  name: string
  marketing: boolean
  avatar: Avatar['url']
  avatar_options: Avatar['extra']
}

export interface ForgotPassword {
  email: string
}

export interface ResetPassword {
  password: string
}

export interface Contact {
  name?: string
  email: string
  question: string
}

export interface BadgeClaim {
  code: string
}
