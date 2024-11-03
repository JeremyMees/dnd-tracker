export const useAuth = defineStore('useAuth', () => {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  const profile = useProfile()

  const isAuthenticated = computed<boolean>(() => !!user.value)

  supabase.auth.onAuthStateChange((event) => {
    if (['INITIAL_SESSION', 'USER_UPDATED', 'SIGNED_IN'].includes(event)) {
      profile.fetch()
    }
  })

  async function login(credentials: Login): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword(credentials)

    if (error) throw createError(error)
  }

  async function logout(): Promise<void> {
    const { error } = await supabase.auth.signOut()

    if (error) throw createError(error)
  }

  async function register(form: Register): Promise<void> {
    const { email, password, ...userData } = form

    const { error, data } = await supabase.auth.signUp({ email, password })

    if (error) throw createError(error)

    if (data?.user) {
      const profile: ProfileInsert = {
        ...userData,
        avatar_options: userData.avatar_options as Json,
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

  async function forgotPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) throw createError(error)
  }

  async function updatePassword(payload: { password: string }): Promise<void> {
    const { error } = await supabase.auth.updateUser(payload)

    if (error) throw createError(error)
  }

  return {
    isAuthenticated,
    login,
    logout,
    register,
    forgotPassword,
    updatePassword,
  }
})
