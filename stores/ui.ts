export const useUI = defineStore('useUI', () => {
  const showNavigation = ref<boolean>(true)

  return {
    showNavigation,
  }
})
