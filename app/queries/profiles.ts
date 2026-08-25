import { useMutation } from '@tanstack/vue-query'
import type { UserAttributes } from '@supabase/supabase-js'

export function useProfileUpdate() {
  const supabase = useSupabaseClient<DB>()
  const user = useState<ProfileRow | null>('auth-user', () => null)

  return useMutation({
    mutationFn: async ({
      data,
      id,
    }: {
      data: ProfileUpdate & { password?: string }
      id: string
    } & QueryDefaults) => {
      const { password, ...profileData } = data

      if (!data.password) {
        const { error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', id)

        if (error) throw createError(error)
      }

      if (data.email || data.password) {
        const updateUser = removeEmptyKeys<UserAttributes>({
          email: data.email,
          password,
        })

        const { error } = await supabase.auth.updateUser(updateUser)

        if (error) throw createError(error)
      }
    },
    onSuccess: (_data, { data, onSuccess }) => {
      if (onSuccess) onSuccess()

      const { password: _password, ...rest } = data
      user.value = { ...user.value!, ...rest }
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
  const { logout } = useAuthentication()

  return useMutation({
    mutationFn: async ({ id }: { id: string } & QueryDefaults) => {
      const { error } = await supabase.from('profiles').delete().eq('id', id)

      if (error) throw createError(error)

      const { error: removeError } = await $fetch('/api/user/remove', {
        method: 'POST',
        body: { id },
      })

      if (removeError) throw createError(removeError.message)

      await logout()
    },
    onSuccess: (_data, { onSuccess }) => {
      if (onSuccess) onSuccess()
    },
    onError: (error, { onError }) => {
      if (onError) onError(error.message)
    },
    onSettled: (_data, error, { onSettled }) => {
      if (onSettled) onSettled(error?.message)
    },
  })
}
