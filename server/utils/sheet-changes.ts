import type { serverSupabaseServiceRole } from '#supabase/server'
import {
  diffRow,
  diffSheet,
  turnEvent,
} from '~~/shared/utils/dnd/combat-events'

export function sheetChangeContext(
  supabase: ReturnType<typeof serverSupabaseServiceRole<DB>>,
  encounterId: number,
  actor: SheetActor,
): SheetChangeContext {
  return {
    store: supabaseSheetStore(supabase),
    broadcaster: realtimeBroadcaster(supabase),
    encounterId,
    actor,
  }
}

export function readSheet(ctx: SheetChangeContext): Promise<StoredSheet> {
  return ctx.store.read(ctx.encounterId)
}

async function logEvents(
  ctx: SheetChangeContext,
  round: number,
  events: CombatEventDraft[],
): Promise<void> {
  await ctx.store.logEvents(
    events.map(event => ({
      encounterId: ctx.encounterId,
      rowId: event.rowId ?? null,
      round,
      type: event.type,
      payload: event.payload,
      createdBy: ctx.actor.id ?? null,
      actorName: ctx.actor.name ?? null,
    })),
  )
}

async function sendSheetAction(
  ctx: SheetChangeContext,
  { rowId, patch }: SheetRowPatch,
): Promise<void> {
  const topic: SheetTopic = { kind: 'sheet', encounterId: ctx.encounterId }
  const version = await ctx.broadcaster.nextVersion(topic)

  await ctx.broadcaster.send(topic, 'action', { version, row: rowId, patch })
}

export async function sendSheetSync(
  ctx: SheetChangeContext,
  reminders?: TurnReminders,
): Promise<void> {
  const topic: SheetTopic = { kind: 'sheet', encounterId: ctx.encounterId }
  const version = await ctx.broadcaster.nextVersion(topic)
  const sheet = await readSheet(ctx)

  await ctx.broadcaster.send(topic, 'sync', {
    version,
    sheet,
    ...(reminders && { reminders }),
  })
}

export async function sendLiveState(
  ctx: SheetChangeContext,
  session: string,
): Promise<void> {
  const topic: SheetTopic = { kind: 'live', session }
  const version = await ctx.broadcaster.nextVersion(topic)
  const sheet = await readSheet(ctx)

  await ctx.broadcaster.send(topic, 'sync', {
    version,
    sheet: toPlayerSheet(sheet),
  })
}

function claimedRows(session: SheetLiveSession | undefined): Set<string> {
  return new Set(session?.seats.flatMap(seat => (seat.row ? [seat.row] : [])))
}

function rowClaimedError() {
  return createError({ statusCode: 409, statusMessage: 'row-claimed' })
}

async function sendLiveActions(
  ctx: SheetChangeContext,
  seat: SheetSeatOrigin,
  patches: SheetRowPatch[],
  after: InitiativeSheetRow[],
): Promise<void> {
  const topic: SheetTopic = { kind: 'live', session: seat.session }
  const afterRows = new Map(after.map(row => [row.id, row]))

  for (const { rowId, patch } of patches) {
    const version = await ctx.broadcaster.nextVersion(topic)

    await ctx.broadcaster.send(topic, 'action', {
      version,
      row: rowId,
      patch: sanitizeBroadcastPatch(afterRows.get(rowId)!, seat.action, patch),
    })
  }
}

interface ApplyRowPatchesOptions {
  before?: StoredSheet
  seat?: SheetSeatOrigin
}

export async function applyRowPatches(
  ctx: SheetChangeContext,
  patches: SheetRowPatch[],
  { before, seat }: ApplyRowPatchesOptions = {},
): Promise<InitiativeSheetRow[]> {
  const sheet = before ?? (await readSheet(ctx))
  const beforeRows = new Map(sheet.rows.map(row => [row.id, row]))

  if (patches.some(({ rowId }) => !beforeRows.has(rowId))) {
    throw createError({ statusCode: 404, statusMessage: 'Row not found' })
  }

  const live =
    !seat && patches.some(({ patch }) => touchesPlayerView(patch))
      ? await ctx.store.liveSession(ctx.encounterId)
      : undefined
  const claimed = claimedRows(live)

  if (patches.some(({ rowId, patch }) => patch.hidden && claimed.has(rowId))) {
    throw rowClaimedError()
  }

  const after = await ctx.store.patchRows(ctx.encounterId, patches)
  const [only] = patches

  await Promise.all([
    logEvents(
      ctx,
      sheet.round,
      after.flatMap(row =>
        diffRow(beforeRows.get(row.id)!, row).map(draft => ({
          ...draft,
          rowId: draft.rowId ?? row.id,
        })),
      ),
    ),
    patches.length === 1 && only
      ? sendSheetAction(ctx, only)
      : sendSheetSync(ctx),
    ...(seat ? [sendLiveActions(ctx, seat, patches, after)] : []),
    ...(live ? [sendLiveState(ctx, live.uuid)] : []),
  ])

  return after
}

function expiredEvents(reminders: TurnReminder[]): CombatEventDraft[] {
  return reminders.map(({ rowId, rowName, condition }) => ({
    type: 'condition_expired',
    rowId,
    payload: {
      rowName,
      condition: { id: condition.id, name: condition.name },
    },
  }))
}

function readyExpiredEvents(
  before: InitiativeSheetRow[],
  after: InitiativeSheetRow[],
): CombatEventDraft[] {
  return after.flatMap((row, index) =>
    before[index]?.readied && !row.readied
      ? [
          {
            type: 'ready_expired',
            rowId: row.id,
            payload: { rowName: row.name },
          },
        ]
      : [],
  )
}

interface AdvanceTurnOptions {
  before?: StoredSheet
  session?: string
  sendReminders?: boolean
}

export async function advanceSheetTurn(
  ctx: SheetChangeContext,
  { before, session, sendReminders }: AdvanceTurnOptions = {},
): Promise<TurnResult> {
  const sheet = before ?? (await readSheet(ctx))
  const advance = advanceTurn(sheet)
  const rowsChanged = advance.rows.some(
    (row, index) => row !== sheet.rows[index],
  )

  const updated = await ctx.store.updateTurn(ctx.encounterId, sheet, {
    activeIndex: advance.activeIndex,
    round: advance.round,
    ...(rowsChanged && { rows: advance.rows }),
  })

  if (!updated) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Turn already advanced',
    })
  }

  const turn = turnEvent(advance.rows, advance.activeIndex)
  const reminders = {
    expired: advance.expired,
    saves: advance.saves,
    recharges: advance.recharges,
  }
  const liveSession =
    session ?? (await ctx.store.liveSession(ctx.encounterId))?.uuid

  await Promise.all([
    logEvents(ctx, advance.round, [
      ...(turn ? [turn] : []),
      ...readyExpiredEvents(sheet.rows, advance.rows),
      ...expiredEvents(advance.expired),
    ]),
    sendSheetSync(ctx, sendReminders ? reminders : undefined),
    ...(liveSession ? [sendLiveState(ctx, liveSession)] : []),
  ])

  return { sheet: updated, ...reminders }
}

const liveViewFields = new Set(['round', 'activeIndex', 'rows', 'settings'])

function hidesClaimedRow(
  before: InitiativeSheetRow[],
  after: InitiativeSheetRow[],
  claimed: Set<string>,
): boolean {
  const wasHidden = new Set(before.filter(row => row.hidden).map(row => row.id))

  return after.some(
    row => row.hidden && claimed.has(row.id) && !wasHidden.has(row.id),
  )
}

export async function applySheetUpdate(
  ctx: SheetChangeContext,
  data: InitiativeSheetUpdate,
): Promise<void> {
  const before = await readSheet(ctx)
  const update = data.rows ? { ...data, rows: normalizeRows(data.rows) } : data
  const live = Object.keys(update).some(key => liveViewFields.has(key))
    ? await ctx.store.liveSession(ctx.encounterId)
    : undefined

  if (
    update.rows &&
    hidesClaimedRow(before.rows, update.rows, claimedRows(live))
  ) {
    throw rowClaimedError()
  }

  await ctx.store.updateSheet(ctx.encounterId, update)

  await Promise.all([
    logEvents(ctx, update.round ?? before.round, diffSheet(before, update)),
    sendSheetSync(ctx),
    ...(live ? [sendLiveState(ctx, live.uuid)] : []),
  ])
}
