import { legendaryActionsPerRound } from '~~/constants/dnd'

type ResourceRow = Pick<InitiativeSheetRow, 'actions' | 'traits'>

const LEGENDARY_RESISTANCE = /legendary resistance\s*\((\d+)\s*\/\s*day/i

export function legendaryActionLimit(row: ResourceRow): number {
  return row.actions?.some(action => action.actionType === 'legendaryAction')
    ? legendaryActionsPerRound
    : 0
}

export function legendaryResistanceLimit(row: ResourceRow): number {
  const names = [...(row.traits ?? []), ...(row.actions ?? [])].map(
    item => item.name,
  )

  for (const name of names) {
    const match = name.match(LEGENDARY_RESISTANCE)

    if (match) return Number(match[1])
  }

  return 0
}

export function actionUseLimit(action: Pick<DndAction, 'usageLimits'>): number {
  const limits = action.usageLimits

  if (limits?.type === 'recharge') return 1
  if (limits?.type === 'perDay' || limits?.type === 'perRest') {
    return limits.param
  }

  return 0
}

export function limitedActions(row: ResourceRow): DndAction[] {
  return (row.actions ?? []).filter(action => actionUseLimit(action) > 0)
}

export function hasResources(row: ResourceRow): boolean {
  return (
    legendaryActionLimit(row) > 0 ||
    legendaryResistanceLimit(row) > 0 ||
    limitedActions(row).length > 0
  )
}

export function refreshResources(
  row: InitiativeSheetRow,
  roll: (sides: number) => number = randomRoll,
): { row: InitiativeSheetRow; recharges: RechargeReminder[] } {
  const { resources } = row

  if (!resources) return { row, recharges: [] }

  const recharges: RechargeReminder[] = []

  for (const action of row.actions ?? []) {
    const limits = action.usageLimits

    if (limits?.type !== 'recharge' || !resources.actions?.[action.name]) {
      continue
    }

    const result = roll(6)
    const recharged = result >= limits.param

    recharges.push({
      rowId: row.id,
      rowName: row.name,
      action: action.name,
      roll: result,
      recharged,
    })
  }

  const changed =
    resources.legendaryActions !== undefined ||
    resources.reaction !== undefined ||
    recharges.some(recharge => recharge.recharged)

  if (!changed) return { row, recharges }

  const ready = new Set(
    recharges
      .filter(recharge => recharge.recharged)
      .map(recharge => recharge.action),
  )
  const actions = Object.fromEntries(
    Object.entries(resources.actions ?? {}).filter(
      ([name]) => !ready.has(name),
    ),
  )

  const {
    legendaryActions: _legendaryActions,
    reaction: _reaction,
    actions: _actions,
    ...rest
  } = resources

  return {
    row: {
      ...row,
      resources: { ...rest, ...(Object.keys(actions).length && { actions }) },
    },
    recharges,
  }
}
