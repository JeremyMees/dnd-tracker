export interface CacheTier {
  maxAge: number
  staleWhileRevalidate: number
  staleIfError: number
}
