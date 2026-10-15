import { useMutation, type MutationOptions } from '@tanstack/vue-query'

export function useCallbackMutation<
  TData,
  TVariables extends QueryDefaults,
  TOnMutateResult = unknown,
>(options: MutationOptions<TData, Error, TVariables, TOnMutateResult>) {
  return useMutation<TData, Error, TVariables, TOnMutateResult>({
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      options.onSuccess?.(data, variables, onMutateResult, context)

      if (variables.onSuccess) variables.onSuccess()
    },
    onError: (error, variables, onMutateResult, context) => {
      options.onError?.(error, variables, onMutateResult, context)

      if (variables.onError) variables.onError(error.message)
    },
    onSettled: (data, error, variables, onMutateResult, context) => {
      options.onSettled?.(data, error, variables, onMutateResult, context)

      if (variables.onSettled) variables.onSettled(error?.message)
    },
  })
}
