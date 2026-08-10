interface LiveTokenClaims {
  session: string
  encounter: number
}

export interface LiveSessionTokenPayload extends LiveTokenClaims {
  kind: 'session'
}

export interface LiveSeatTokenPayload extends LiveTokenClaims {
  kind: 'seat'
  seat: string
  name: string
  spectator: boolean
}

export interface LiveRowTokenPayload extends LiveTokenClaims {
  kind: 'row'
  row: string
}

export interface LiveSeat {
  seat: string
  row: string | null
  name: string
  spectator: boolean
}

export type LiveSeatsBroadcast =
  | { type: 'joined'; seat: LiveSeat }
  | { type: 'kicked'; seat: string }
  | { type: 'reassigned'; seat: string; row: string | null }
