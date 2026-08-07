type CoolDown = { seconds: number; interval: NodeJS.Timeout }

export function useCoolDown() {
  const coolDowns = reactive(new Map<number, CoolDown>())

  const startCoolDown = (id: number, seconds: number) => {
    if (coolDowns.has(id)) return

    const interval = setInterval(() => {
      const coolDown = coolDowns.get(id)

      if (!coolDown) return

      if (coolDown.seconds > 0) {
        coolDown.seconds -= 1
      } else {
        clearInterval(coolDown.interval)
        coolDowns.delete(id)
      }
    }, 1000)

    coolDowns.set(id, { seconds, interval })
  }

  const clearAllCoolDowns = () => {
    coolDowns.forEach(({ interval }) => clearInterval(interval))
    coolDowns.clear()
  }

  if (getCurrentInstance()) {
    onBeforeUnmount(() => clearAllCoolDowns())
  }

  const isInCoolDown = (id: number): boolean =>
    (coolDowns.get(id)?.seconds ?? 0) > 0
  const getRemainingTime = (id: number) => coolDowns.get(id)?.seconds || 0

  return {
    startCoolDown,
    clearAllCoolDowns,
    isInCoolDown,
    getRemainingTime,
    coolDowns,
  }
}
