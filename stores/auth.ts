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

    if (error) throw error
  }

  async function logout(): Promise<void> {
    const { error } = await supabase.auth.signOut()

    if (error) throw error
  }

  return {
    isAuthenticated,
    login,
    logout,
  }
})
