import { toast } from 'vue-sonner'

export function useTransferFile() {
  const { t } = useI18n()

  function download<K extends TransferKind>(
    kind: K,
    items: TransferItems[K][],
  ): void {
    downloadJson(transferFileName(kind), createTransferFile(kind, items))
  }

  async function read<K extends TransferKind>(
    file: File,
    kind: K,
    room: number,
  ): Promise<TransferItems[K][] | undefined> {
    try {
      const items = await readTransferFile(file, kind)

      assertTransferRoom(items.length, room)

      return items
    } catch (error) {
      const reason = error instanceof TransferError ? error : undefined

      toast.error(t('components.transfer.error'), {
        description: t(
          `components.transfer.reasons.${reason?.reason ?? 'invalidFile'}`,
          { count: reason?.count ?? 0 },
          reason?.count ?? 0,
        ),
      })
    }
  }

  return { download, read }
}
