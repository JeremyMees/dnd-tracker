import { fetchMock, mountHook } from '~~/test/nuxt/stubs/query'
import { clearQueryCache } from '~~/test/nuxt/stubs/query-client'
import { beforeEach, describe, expect, it } from 'vitest'
import { useRemoteSheetAdapter } from '~/composables/useRemoteSheetAdapter'
import { sheet } from '~~/test/fixtures/initiative-sheet'

const [first, second] = sheet.rows

async function mountAdapter() {
  const { vm } = await mountHook(() => ({ adapter: useRemoteSheetAdapter(2) }))

  return vm.adapter
}

describe('useRemoteSheetAdapter', () => {
  beforeEach(async () => {
    await clearQueryCache()
    fetchMock.mockReset()
  })

  it('patches a single row through patch-row', async () => {
    fetchMock.mockResolvedValue({ row: first })
    const adapter = await mountAdapter()

    await adapter.patchRows([{ rowId: first!.id, patch: { hitPoints: 1 } }])

    expect(fetchMock).toHaveBeenCalledWith('/api/encounter/2/patch-row', {
      method: 'POST',
      body: { rowId: first!.id, patch: { hitPoints: 1 } },
    })
  })

  it('patches several rows in one patch-rows request', async () => {
    fetchMock.mockResolvedValue({ rows: [first, second] })
    const adapter = await mountAdapter()
    const patches = [
      { rowId: first!.id, patch: { hitPoints: 1 } },
      { rowId: second!.id, patch: { hidden: false } },
    ]

    await adapter.patchRows(patches)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('/api/encounter/2/patch-rows', {
      method: 'POST',
      body: { patches },
    })
  })

  it('sends nothing for no patches', async () => {
    const adapter = await mountAdapter()

    await adapter.patchRows([])

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('updates the sheet through the encounter route', async () => {
    fetchMock.mockResolvedValue(undefined)
    const adapter = await mountAdapter()

    await adapter.update({ round: 3 })

    expect(fetchMock).toHaveBeenCalledWith('/api/encounter/2', {
      method: 'PATCH',
      body: { round: 3 },
    })
  })

  it('advances the turn and returns only the reminders', async () => {
    const reminders = { expired: [], saves: [], recharges: [] }

    fetchMock.mockResolvedValue({ sheet, ...reminders })
    const adapter = await mountAdapter()

    expect(await adapter.nextTurn()).toEqual(reminders)
    expect(fetchMock).toHaveBeenCalledWith('/api/encounter/2/turn', {
      method: 'POST',
    })
  })

  it('rejects when the server refuses the change', async () => {
    fetchMock.mockRejectedValue(new Error('row-claimed'))
    const adapter = await mountAdapter()

    await expect(
      adapter.patchRows([{ rowId: first!.id, patch: { hidden: true } }]),
    ).rejects.toThrow('row-claimed')
  })
})
