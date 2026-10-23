import { toast } from 'vue-sonner'

export function useTurnReminders(
  sheet: Ref<InitiativeSheet | undefined>,
  patchRow: (
    rowId: string,
    patch: Partial<InitiativeSheetRow>,
  ) => Promise<void>,
) {
  const { t } = useI18n()

  let shown: (string | number)[] = []

  function markSaved({ rowId, condition }: TurnReminder): void {
    const row = sheet.value?.rows.find(item => item.id === rowId)

    if (!row) return

    patchRow(row.id, resolveSave(row, condition.id))
  }

  function saveMessage({ rowName, condition }: TurnReminder): string {
    const save = condition.duration?.save

    return t('components.turnReminders.save', {
      name: rowName,
      ability: save ? formatAbilityShort(save.ability) : '',
      dc: save?.dc,
      condition: condition.name,
    })
  }

  function rechargeToast({
    rowName,
    action,
    roll,
    recharged,
  }: RechargeReminder) {
    const message = t(
      `components.turnReminders.${recharged ? 'recharged' : 'notRecharged'}`,
      { name: rowName, action, roll },
    )

    return recharged ? toast.success(message) : toast.info(message)
  }

  return function showTurnReminders({
    expired,
    saves,
    recharges = [],
  }: TurnReminders): void {
    shown.forEach(id => toast.dismiss(id))

    shown = [
      ...saves.map(reminder =>
        toast.warning(saveMessage(reminder), {
          duration: Infinity,
          action: {
            label: t('components.turnReminders.saved'),
            onClick: () => markSaved(reminder),
          },
          cancel: {
            label: t('components.turnReminders.failed'),
            onClick: () => undefined,
          },
        }),
      ),
      ...expired.map(({ rowName, condition }) =>
        toast.info(
          t('components.turnReminders.expired', {
            name: rowName,
            condition: condition.name,
          }),
        ),
      ),
      ...recharges.map(rechargeToast),
    ]
  }
}
