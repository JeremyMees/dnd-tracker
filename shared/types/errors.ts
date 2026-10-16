export type FailureReason =
  | 'offline'
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'rateLimited'
  | 'limitReached'
  | 'homebrewLimit'
  | 'noteLimit'
  | 'rejected'

export type AuthFailure =
  | 'emailInUse'
  | 'emailInvalid'
  | 'weakPassword'
  | 'samePassword'
  | 'sessionExpired'
  | 'invalidCredentials'
  | 'emailNotConfirmed'
