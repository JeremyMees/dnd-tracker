export function useModal() {
  const modals = useState<Modal[]>('modals', () => ([]))

  function remove(uuid: string): void {
    modals.value = modals.value.filter(obj => obj.uuid !== uuid)
  }

  function add(newModal: Omit<Modal, 'uuid'>): string {
    const uuid = self.crypto.randomUUID()

    modals.value = [
      ...modals.value,
      { ...newModal, uuid },
    ]

    return uuid
  }

  return {
    modals,
    add,
    remove,
  }
}
