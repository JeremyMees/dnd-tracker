import type { UserAttributes } from '@supabase/supabase-js'
import { useToast } from '~/components/ui/toast'

export function useProfileUpdate() {
  const supabase = useSupabaseClient<DB>()
  const user = useState<ProfileRow | null>('auth-user', () => null)

  return useCallbackMutation({
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
    onSuccess: (_data, { data }) => {
      const { password: _password, ...rest } = data
      user.value = { ...user.value!, ...rest }
    },
  })
}

export function useProfileRemove() {
  const supabase = useSupabaseClient<DB>()
  const { logout } = useAuthentication()
  const { toast } = useToast()
  const { t } = useI18n()

  return useCallbackMutation({
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
    onError: error => {
      toast({
        title: t('general.error.failed.accountDelete'),
        description: t(`general.error.reasons.${getFailureReason(error)}`),
        variant: 'destructive',
      })
    },
  })
}
