export type ToastType = 'error' | 'warn' | 'info' | 'success'

export interface Toast {
  key: number
  timeout: number
  title: string
  text: string
  actions: any[]
  timed: boolean
  type: ToastType
}

export type CreateToast = Partial<Omit<Toast, 'key' | 'type'>>

export type FeatureSortBy = 'voted_most' | 'voted_least' | 'first_new' | 'first_old'

export type FeatureType = 'all' | 'my'

export type FeatureVote = 'like' | 'dislike'

export interface FeatureVotes {
  like: string[]
  dislike: string[]
}
