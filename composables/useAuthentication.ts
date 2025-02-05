import { useQueryClient } from '@tanstack/vue-query'

export function useAuthentication() {
  const user = useState<ProfileRow | null>('auth-user', () => null)
  const ready = useState<boolean>('auth-ready', () => false)

  const supabase = useSupabaseClient<Database>()
  const supabaseUser = useSupabaseUser()
  const queryClient = useQueryClient()
  const localePath = useLocalePath()

  supabase.auth.onAuthStateChange((event) => {
    if (['INITIAL_SESSION', 'USER_UPDATED', 'SIGNED_IN'].includes(event)) {
      fetch()
    }
  })

  async function register(form: Register): Promise<void> {
    const { email, password, ...userData } = form

    const { error, data } = await supabase.auth.signUp({ email, password })

    if (error) throw createError(error)

    if (data?.user) {
      const profile: ProfileInsert = {
        ...userData,
        avatar_options: userData.avatar_options as Record<string, string | number>,
        email,
        id: data.user.id,
      }

      const { error } = await supabase.from('profiles').insert([profile])

      if (error) {
        throw createError(
          error?.message.includes('duplicate key')
            ? 'Email already in use'
            : error,
        )
      }
    }
  }

  async function login(credentials: Login): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword(credentials)

    if (error) throw createError(error)
  }

  async function logout(): Promise<void> {
    const { error } = await supabase.auth.signOut()

    if (error) throw createError(error)
    else {
      setTimeout(() => navigateTo(localePath('/login')), 100)

      user.value = null
    }
  }

  async function fetch(): Promise<void> {
    if (supabaseUser.value) {
      const cachedData = queryClient.getQueryData<ProfileRow>(['useProfileDetail', supabaseUser.value.id])

      if (cachedData) {
        user.value = cachedData
      }
      else {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseUser.value.id)
          .single()

        if (error?.details.includes('Results contain 0 rows')) {
          await logout()
        }

        if (error) throw createError(error)

        if (data) {
          user.value = data
          queryClient.setQueryData(['useProfileDetail', supabaseUser.value.id], data)
        }
      }
    }

    if (!ready.value) {
      ready.value = true
    }
  }

  return {
    user,
    register,
    login,
    logout,
    fetch,
  }
}

export const useAuthenticatedUser = () => {
  const { user } = useAuthentication()

  return computed(() => {
    const userValue = unref(user)

    if (!userValue) throw createError('useAuthenticatedUser() can only be used in protected pages')

    return userValue
  })
}
