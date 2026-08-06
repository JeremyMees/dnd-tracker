const CLOSE_ANIMATION_DURATION = 200

export function useModal() {
  const modals = useState<Modal[]>('modals', () => [])

  function close(uuid: string): void {
    const modal = modals.value.find(obj => obj.uuid === uuid)

    if (modal) {
      modal.closing = true

      setTimeout(() => {
        modals.value = modals.value.filter(obj => obj.uuid !== uuid)
      }, CLOSE_ANIMATION_DURATION)
    }
  }

  function open(newModal: Omit<Modal, 'uuid'>): string {
    const uuid = crypto.randomUUID()

    const modalExists: boolean =
      modals.value.findIndex(
        ({ component }) => component === newModal.component,
      ) > -1

    if (!modalExists) {
      modals.value = [...modals.value, { ...newModal, uuid }]
    }

    return uuid
  }

  return {
    modals,
    open,
    close,
  }
}
