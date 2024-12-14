export const useInitiativeSheet = defineStore('useInitiativeSheet', () => {
  const isPlayground = ref<boolean>(true)
  const isSandbox = ref<boolean>(true)

  return {
    isPlayground,
    isSandbox,
  }
})
