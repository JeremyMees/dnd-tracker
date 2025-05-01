type CoolDowns = Record<string, number>

export function useCoolDown() {
  const coolDowns: CoolDowns = reactive({})

  const startCoolDown = (id: number, seconds: number) => {
    if (!coolDowns[id]) {
      coolDowns[id] = seconds

      const interval = setInterval(() => {
        if (coolDowns[id] && coolDowns[id] > 0) {
          coolDowns[id] -= 1
        }
        else {
          clearInterval(interval)
          delete coolDowns[id]
        }
      }, 1000)
    }
  }

  const isInCoolDown = (id: number): boolean => {
    return !!coolDowns[id] && coolDowns[id] > 0
  }

  const getRemainingTime = (id: number) => {
    return coolDowns[id] ? coolDowns[id] : 0
  }

  return {
    startCoolDown,
    isInCoolDown,
    getRemainingTime,
    coolDowns,
  }
}
