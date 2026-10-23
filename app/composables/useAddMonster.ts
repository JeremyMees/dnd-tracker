import { toast } from 'vue-sonner'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'

export function useAddMonster() {
  const injected = inject(INITIATIVE_SHEET, undefined)
  const { t } = useI18n()
  const showToastItems = useToastItems()

  const isAvailable = computed(() => !!injected)
  const isFull = computed(() => hasMaxCharacters(injected?.sheet.value))

  async function addMonster(monster: DndMonster): Promise<void> {
    const sheet = injected?.sheet.value

    if (!injected || !sheet) return

    const added = addToEncounter(sheet, [{ monster }])

    if (added.full) return showToastItems([added.toast])

    await injected.editRows(added.rows)

    toast.success(
      t('components.initiativeTable.bestiary.added', {
        name: monster.name,
      }),
      {
        description: t('components.initiativeTable.bestiary.addedDescription'),
      },
    )
  }

  return { isAvailable, isFull, addMonster }
}
