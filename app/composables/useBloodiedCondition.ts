import { useConditionsListing } from '~/queries/srd'
import { bloodiedConditionId } from '~~/constants/dnd'

export function useBloodiedCondition(
  settings: MaybeRefOrGetter<InitiativeSettings | undefined>,
): ComputedRef<DndCondition | undefined> {
  const { data: conditions } = useConditionsListing()

  return computed(() => {
    if (!isBloodiedEnabled(toValue(settings))) return undefined

    return conditions.value?.find(({ id }) => id === bloodiedConditionId)
  })
}
