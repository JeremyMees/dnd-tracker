import type { UserAttributes } from '@supabase/supabase-js'

export const useProfile = defineStore('useProfile', () => {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  const auth = useAuth()

  const loading = ref<boolean>(false)
  const error = ref<string>()
  const data = ref<ProfileRow>()

  const getSocialProfile = computed<SocialProfile | null>(() => {
    if (!data.value) return null
    else {
      const {
        marketing,
        subscription_type,
        temp_subscription,
        stripe_id,
        stripe_session_id,
        ...social
      } = data.value

      return social
    }
  })

  async function get(): Promise<void> {
    error.value = undefined

    try {
      if (!user.value) data.value = undefined

      else if (!loading.value) {
        loading.value = true

        const { data: prof, error: err } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.value.id)
          .single()

        if (err) {
          if (err.details.includes('Results contain 0 rows')) {
            await auth.logout()
          }
          else {
            error.value = err.details
          }
        }
        if (prof) data.value = prof
      }
    }
    catch (err: any) {
      error.value = err as string
    }
    finally {
      loading.value = false
    }
  }

  async function updateProfile(form: ProfileUpdate & { password?: string }): Promise<void> {
    if (!form.password) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(form)
        .eq('id', user.value!.id)
        .select('*')

      if (profileError) throw createError(profileError)
    }

    if (form.email || form.password) {
      const updateUser = removeEmptyKeys<UserAttributes>({
        email: form.email,
        password: form.password,
      })

      const { error: userErr } = await supabase.auth.updateUser(updateUser)

      if (userErr) throw createError(userErr)
    }

    get()
  }

  async function deleteProfile(): Promise<void> {
    const id = user.value!.id
    // logout user
    await auth.logout()
    // delete user profile and data with cascade delete
    const { error: err } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)

    if (err) throw createError(err)
    // delete user auth profile
    const { data: prof, error: fetchError } = await useFetch('/api/user/remove', {
      method: 'POST',
      body: { id },
    })

    if (prof.value?.error) throw createError(prof.value.error)
    if (fetchError.value) throw createError(fetchError.value)

    data.value = undefined
  }

  async function getProfile(match: Record<string, any>): Promise<Profile | null> {
    const { data, error: err } = await supabase
      .from('profiles')
      .select('id, username, name, avatar, email')
      .match(match)
      .maybeSingle()

    if (err) throw createError(err)

    return data
  }

  return {
    loading,
    error,
    data,
    getSocialProfile,
    user,
    get,
    updateProfile,
    deleteProfile,
    getProfile,
  }
})
