export const useAuth = defineStore('useAuth', () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const isAuthenticated = computed<boolean>(() => !!user.value)

  async function login(credentials: Login): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword(credentials)

    if (error) throw error
  }

  return {
    isAuthenticated,
    login,
  }
})
