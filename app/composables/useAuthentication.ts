export interface AuthUser extends ProfileRow { }

export function useAuthentication() {
  const user = useState<AuthUser | null>('auth-user', () => null)
  const gc = useState<number | null>('auth-gc', () => null)
  const ready = useState<boolean>('auth-ready', () => false)

  const supabase = useSupabaseClient<DB>()
  const localePath = useLocalePath()

  supabase.auth.onAuthStateChange((event) => {
    if (['USER_UPDATED', 'SIGNED_IN'].includes(event)) fetch()
    else if (event === 'INITIAL_SESSION' && !user.value) fetch()
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
      gc.value = null
    }
  }

  async function fetch(forceRefresh = false): Promise<void> {
    const res = await supabase.auth.getUser()
    const userId = res.data.user?.id

    if (userId) {
      if (
        user.value
        && gc.value
        && new Date().getTime() - gc.value < 1000 * 60 * 5
        && !forceRefresh
      ) return

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error?.details.includes('Results contain 0 rows')) {
        await logout()
      }

      if (error) {
        gc.value = null
        throw createError(error)
      }

      if (data) {
        user.value = data
        gc.value = new Date().getTime()
      }
    }

    if (!ready.value) ready.value = true
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
    const userValue: AuthUser | null = unref(user)

    if (!userValue) throw createError('useAuthenticatedUser() can only be used in protected pages')

    return userValue
  })
}
