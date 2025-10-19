type CoolDown = { seconds: number, interval: NodeJS.Timeout }
type CoolDowns = Record<string, CoolDown>

export function useCoolDown() {
  const coolDowns: CoolDowns = reactive({})

  const startCoolDown = (id: number, seconds: number) => {
    if (!coolDowns[id]) {
      const interval = setInterval(() => {
        if (coolDowns[id] && coolDowns[id].seconds > 0) {
          coolDowns[id].seconds -= 1
        }
        else if (coolDowns[id]) {
          clearInterval(coolDowns[id].interval)
          delete coolDowns[id]
        }
      }, 1000)

      coolDowns[id] = { seconds, interval }
    }
  }

  const clearAllCoolDowns = () => {
    Object.values(coolDowns).forEach(({ interval }) => clearInterval(interval))
    Object.keys(coolDowns).forEach(key => delete coolDowns[key])
  }

  onBeforeUnmount(() => clearAllCoolDowns())

  const isInCoolDown = (id: number): boolean => !!coolDowns[id] && coolDowns[id].seconds > 0
  const getRemainingTime = (id: number) => coolDowns[id]?.seconds || 0

  return {
    startCoolDown,
    clearAllCoolDowns,
    isInCoolDown,
    getRemainingTime,
    coolDowns,
  }
}
