export function useLiveRealtime(
  token: ComputedRef<string | undefined>,
  uuid: ComputedRef<string | undefined>,
  seatToken: ComputedRef<string | undefined>,
  seatId: ComputedRef<string | undefined>,
  ownRow: ComputedRef<string | null | undefined>,
) {
  const { show: showSummary } = useLiveSummary()

  const { refetch } = useSheetReplica<
    LiveStateResponse,
    LiveActionEvent,
    LiveSyncEvent
  >({
    topic: () => (uuid.value ? `live:${uuid.value}` : undefined),
    queryKey: () => queryKeys.liveState(token.value, seatToken.value),
    version: state => state.session.version,
    withVersion: (state, version) => ({
      ...state,
      session: { ...state.session, version },
    }),
    mergeAction: (state, { row }) => {
      if (ownRow.value && row.id === ownRow.value) return undefined

      return {
        ...state,
        sheet: {
          ...state.sheet,
          rows: state.sheet.rows.map(item => (item.id === row.id ? row : item)),
        },
      }
    },
    mergeSync: (state, { sheet }) =>
      ownRow.value ? undefined : { ...state, sheet },
    listen: channel =>
      channel
        .on('broadcast', { event: 'seats' }, ({ payload }) =>
          applySeats(payload as LiveSeatsBroadcast),
        )
        .on('broadcast', { event: 'summary' }, ({ payload }) =>
          showSummary((payload as LiveSummaryEvent).stats),
        )
        .on('broadcast', { event: 'ended' }, () => refetch()),
    onSubscribed: channel => {
      if (seatId.value) void channel.track({ seat: seatId.value })
    },
  })

  function applySeats(payload: LiveSeatsBroadcast): void {
    if (payload.type !== 'joined' && payload.seat === seatId.value) refetch()
  }
}
