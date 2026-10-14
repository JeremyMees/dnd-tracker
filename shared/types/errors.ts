export type FailureReason =
  | 'offline'
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'rateLimited'
  | 'rejected'

export type AuthFailure =
  | 'emailInUse'
  | 'emailInvalid'
  | 'weakPassword'
  | 'samePassword'
  | 'sessionExpired'
  | 'invalidCredentials'
  | 'emailNotConfirmed'
