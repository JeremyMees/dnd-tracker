import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { UserAttributes } from '@supabase/supabase-js'

export function useProfileDetail(id: string) {
  const supabase = useSupabaseClient<DB>()
  const { logout } = useAuthentication()

  return useQuery({
    queryKey: ['useProfileDetail', id],
    queryFn: async () => await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single(),
    select: async ({ data, error }) => {
      if (error?.details.includes('Results contain 0 rows')) {
        await logout()
      }
      if (error) throw createError(error)

      return data
    },
  })
}

export function useProfileUpdate() {
  const supabase = useSupabaseClient<DB>()
  const queryClient = useQueryClient()
  const user = useState<ProfileRow | null>('auth-user', () => null)

  return useMutation({
    mutationFn: async ({ data, id }: { data: ProfileUpdate & { password?: string }, id: string } & QueryDefaults) => {
      if (!data.password) {
        const { error } = await supabase
          .from('profiles')
          .update(data)
          .eq('id', id)

        if (error) throw createError(error)
      }

      if (data.email || data.password) {
        const updateUser = removeEmptyKeys<UserAttributes>({
          email: data.email,
          password: data.password,
        })

        const { error } = await supabase.auth.updateUser(updateUser)

        if (error) throw createError(error)
      }
    },
    onSuccess: (_data, { data, id, onSuccess }) => {
      if (onSuccess) onSuccess()

      const { password: _password, ...rest } = data
      user.value = { ...user.value!, ...rest }

      queryClient.invalidateQueries({ queryKey: ['useProfileDetail', id] })
    },
    onError: (error, { onError }) => {
      if (onError) onError(error.message)
    },
    onSettled: (_data, error, { onSettled }) => {
      if (onSettled) onSettled(error?.message)
    },
  })
}

export function useProfileRemove() {
  const supabase = useSupabaseClient<DB>()
  const queryClient = useQueryClient()
  const { logout } = useAuthentication()

  return useMutation({
    mutationFn: async ({ id }: { id: string } & QueryDefaults) => {
      await logout()

      const { error } = await supabase.from('profiles').delete().eq('id', id)

      if (error) throw createError(error)

      const { data: prof, error: fetchError } = await useFetch('/api/user/remove', {
        method: 'POST',
        body: { id },
      })

      if (prof.value?.error) throw createError(prof.value.error)
      if (fetchError.value) throw createError(fetchError.value)
    },
    onSuccess: (_data, { id, onSuccess }) => {
      if (onSuccess) onSuccess()

      queryClient.invalidateQueries({ queryKey: ['useProfileDetail', id] })
    },
    onError: (error, { onError }) => {
      if (onError) onError(error.message)
    },
    onSettled: (_data, error, { onSettled }) => {
      if (onSettled) onSettled(error?.message)
    },
  })
}
