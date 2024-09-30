export const useProfile = defineStore('useProfile', () => {
  const user = useSupabaseUser()

  const isAuthenticated = computed<boolean>(() => !!user.value)

  return {
    isAuthenticated,
  }
})
