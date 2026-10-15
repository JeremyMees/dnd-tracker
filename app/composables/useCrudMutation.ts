import { useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'

export function useCrudMutation<TVariables extends QueryDefaults, TData = void>(
  options: CrudMutationOptions<TVariables, TData>,
) {
  const queryClient = useQueryClient()
  const { t } = useI18n()

  const type = t(options.type).toLowerCase()

  return useCallbackMutation({
    mutationFn: options.mutationFn,
    onSuccess: (_data, variables) => {
      for (const queryKey of options.invalidate(variables)) {
        queryClient.invalidateQueries({ queryKey })
      }

      for (const queryKey of options.remove?.(variables) ?? []) {
        queryClient.removeQueries({ queryKey })
      }

      const message = t(`components.toast.${options.action}.success`, { type })

      toast.success(message)
    },
    onError: error => {
      toast.error(t(`components.toast.${options.action}.error`, { type }), {
        description: t(`general.error.reasons.${getFailureReason(error)}`),
      })
    },
  })
}
