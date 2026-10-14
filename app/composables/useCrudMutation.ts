import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useToast } from '~/components/ui/toast/use-toast'

export function useCrudMutation<TVariables extends QueryDefaults, TData = void>(
  options: CrudMutationOptions<TVariables, TData>,
) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useI18n()

  const type = t(options.type).toLowerCase()

  return useMutation({
    mutationFn: options.mutationFn,
    onSuccess: (_data, variables) => {
      if (variables.onSuccess) variables.onSuccess()

      for (const queryKey of options.invalidate(variables)) {
        queryClient.invalidateQueries({ queryKey })
      }

      for (const queryKey of options.remove?.(variables) ?? []) {
        queryClient.removeQueries({ queryKey })
      }

      const message = t(`components.toast.${options.action}.success`, { type })

      toast(
        options.action === 'delete'
          ? { title: message, variant: 'success' }
          : { description: message, variant: 'success' },
      )
    },
    onError: (error, { onError }) => {
      if (onError) onError(error.message)

      toast({
        title: t(`components.toast.${options.action}.error`, { type }),
        description: t(`general.error.reasons.${getFailureReason(error)}`),
        variant: 'destructive',
      })
    },
    onSettled: (_data, error, { onSettled }) => {
      if (onSettled) onSettled(error?.message)
    },
  })
}
