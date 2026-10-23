import { useConditionsListing } from '~/queries/srd'
import { bloodiedConditionId } from '~~/constants/dnd'

export function useBloodiedCondition(
  settings: MaybeRefOrGetter<Pick<InitiativeSettings, 'bloodied'> | undefined>,
): ComputedRef<DndCondition | undefined> {
  const { data: conditions } = useConditionsListing()

  return computed(() => {
    if (!isBloodiedEnabled(toValue(settings))) return undefined

    return conditions.value?.find(({ id }) => id === bloodiedConditionId)
  })
}
