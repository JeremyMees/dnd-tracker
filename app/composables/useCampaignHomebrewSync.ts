import {
  useHomebrewCount,
  useHomebrewCreate,
  useHomebrewUpdate,
} from '~/queries/homebrews'
import { maxCampaignHomebrews } from '~~/constants/validation'

export function useCampaignHomebrewSync({
  campaignId,
  linkedId,
  countEnabled,
  onError,
}: {
  campaignId?: number
  linkedId?: number
  countEnabled: MaybeRefOrGetter<boolean>
  onError: (error: string) => void
}) {
  const isLinked = isDefined(linkedId)

  const { mutateAsync: createHomebrew } = useHomebrewCreate()
  const { mutateAsync: updateHomebrew } = useHomebrewUpdate()
  const { data: count } = useHomebrewCount(
    campaignId ?? 0,
    computed(() => isDefined(campaignId) && !isLinked && toValue(countEnabled)),
  )

  const isFull = computed(
    () => !isLinked && (count.value ?? 0) >= maxCampaignHomebrews,
  )

  async function create(data: HomebrewData): Promise<number | null> {
    if (!campaignId) return null

    try {
      return await createHomebrew({
        data: { ...data, campaign: campaignId } as HomebrewItemInsert,
        onError,
      })
    } catch {
      return null
    }
  }

  async function update(id: number, data: HomebrewData): Promise<boolean> {
    try {
      await updateHomebrew({ data, id, onError })

      return true
    } catch {
      return false
    }
  }

  async function sync(data: HomebrewData): Promise<number | undefined | null> {
    if (!campaignId) return linkedId
    if (!isDefined(linkedId)) return create(data)

    return (await update(linkedId, data)) ? linkedId : null
  }

  return { isLinked, isFull, create, update, sync }
}
