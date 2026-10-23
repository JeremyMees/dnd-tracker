import { toast } from 'vue-sonner'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'

export function useAddMonster() {
  const injected = inject(INITIATIVE_SHEET, undefined)
  const { t } = useI18n()

  const isAvailable = computed(() => !!injected)
  const isFull = computed(() => hasMaxCharacters(injected?.sheet.value))

  async function addMonster(monster: DndMonster): Promise<void> {
    const sheet = injected?.sheet.value

    if (!injected || !sheet) return

    await injected.editRows(addToEncounter(sheet, [{ monster }]))

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
