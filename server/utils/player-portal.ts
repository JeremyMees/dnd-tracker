export async function resolveOwnRowId(
  seatToken: unknown,
  session: LiveSessionTokenPayload,
  seats: LiveSeat[],
): Promise<OwnSeat> {
  if (!seatToken || typeof seatToken !== 'string') {
    return { row: undefined, kicked: false }
  }

  try {
    const payload = await verifyLiveSeatToken(seatToken)

    if (
      payload.session !== session.session ||
      payload.encounter !== session.encounter
    ) {
      return { row: undefined, kicked: false }
    }

    const seat = seats.find(s => s.seat === payload.seat)

    if (!seat) return { row: undefined, kicked: true }

    return { row: seat.row ?? undefined, kicked: false }
  } catch {
    return { row: undefined, kicked: false }
  }
}
