export const useAuth = defineStore('useAuth', () => {
  const user = useSupabaseUser()

  const isAuthenticated = computed<boolean>(() => !!user.value)

  return {
    isAuthenticated,
  }
})
