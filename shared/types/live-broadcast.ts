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

export interface LiveActionEvent {
  version: number
  row: string
  patch: Partial<PlayerRow>
}

export interface LiveSyncEvent {
  version: number
  sheet: PlayerSheet
}

export type LiveAction =
  | { type: 'hp'; hpType: 'heal' | 'damage' | 'temp'; amount: number }
  | { type: 'ac'; acType: 'add' | 'remove' | 'temp'; amount: number }
  | { type: 'deathSaves'; value: DndDeathSaves }
  | { type: 'concentration'; value: boolean }
  | { type: 'conditions'; value: DndCondition[] }

export type LiveAllowActions = Record<LiveAction['type'], boolean>

export interface LiveJoinResponse {
  sessionToken: string
  seatToken: string
  seat: string
  row: string | null
  spectator: boolean
  code: string
  expiresAt: string
  uuid: string
}
