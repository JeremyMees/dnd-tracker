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
  avatar: string
}
