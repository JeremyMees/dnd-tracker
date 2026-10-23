import {
  useInitiativeSheetDetailUpdate,
  useInitiativeSheetPatch,
  useInitiativeSheetPatchRows,
  useInitiativeSheetTurn,
} from '~/queries/initiative-sheets'

export function useRemoteSheetAdapter(id: number): SheetAdapter {
  const { mutateAsync: update } = useInitiativeSheetDetailUpdate()
  const { mutateAsync: patch } = useInitiativeSheetPatch()
  const { mutateAsync: patchRows } = useInitiativeSheetPatchRows()
  const { mutateAsync: turn } = useInitiativeSheetTurn()

  return {
    update: data => update({ id, data }),
    async patchRows(patches) {
      const [only] = patches

      if (patches.length === 1 && only) {
        await patch({ id, rowId: only.rowId, patch: only.patch })
      } else if (patches.length) {
        await patchRows({ id, patches })
      }
    },
    async nextTurn() {
      const { expired, saves, recharges } = await turn({ id })

      return { expired, saves, recharges }
    },
  }
}
