import { toast, resetToast } from '~~/test/nuxt/stubs/toast'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTransferFile } from '~/composables/useTransferFile'

const { downloadJson } = vi.hoisted(() => ({ downloadJson: vi.fn() }))

mockNuxtImport('downloadJson', () => downloadJson)

function transferFile(kind: TransferKind, items: unknown[]): File {
  return new File(
    [
      JSON.stringify({
        format: 'dnd-tracker',
        kind,
        version: 1,
        exportedAt: '2026-10-16T00:00:00.000Z',
        items,
      }),
    ],
    'export.json',
  )
}

describe('useTransferFile', () => {
  beforeEach(() => {
    resetToast()
    downloadJson.mockReset()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-16T10:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('Should download the items as a transfer file', () => {
    useTransferFile().download('homebrews', [{ name: 'Orc', actions: [] }])

    expect(downloadJson).toHaveBeenCalledWith(
      'dnd-tracker-homebrews-2026-10-16.json',
      {
        format: 'dnd-tracker',
        kind: 'homebrews',
        version: 1,
        exportedAt: '2026-10-16T10:00:00.000Z',
        items: [{ name: 'Orc', actions: [] }],
      },
    )
  })

  it('Should return the items of a valid file that fits', async () => {
    const items = await useTransferFile().read(
      transferFile('homebrews', [{ name: 'Orc' }]),
      'homebrews',
      1,
    )

    expect(items).toEqual([expect.objectContaining({ name: 'Orc' })])
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('Should toast the reason of an invalid file', async () => {
    const items = await useTransferFile().read(
      new File(['nope'], 'export.json'),
      'encounters',
      10,
    )

    expect(items).toBeUndefined()
    expect(toast.error).toHaveBeenCalledWith('components.transfer.error', {
      description: 'components.transfer.reasons.invalidFile',
    })
  })

  it('Should toast an unsupported file on the homebrew page', async () => {
    await useTransferFile().read(
      new File(['nope'], 'export.json'),
      'homebrews',
      10,
    )

    expect(toast.error).toHaveBeenCalledWith('components.transfer.error', {
      description: 'components.transfer.reasons.unsupportedFile',
    })
  })

  it('Should toast the reason of a file of the other kind', async () => {
    await useTransferFile().read(
      transferFile('encounters', [{ title: 'Ambush', rows: [] }]),
      'homebrews',
      10,
    )

    expect(toast.error).toHaveBeenCalledWith('components.transfer.error', {
      description: 'components.transfer.reasons.wrongKind',
    })
  })

  it('Should toast when the items do not fit', async () => {
    const items = await useTransferFile().read(
      transferFile('homebrews', [{ name: 'Orc' }, { name: 'Goblin' }]),
      'homebrews',
      1,
    )

    expect(items).toBeUndefined()
    expect(toast.error).toHaveBeenCalledWith('components.transfer.error', {
      description: 'components.transfer.reasons.tooMany',
    })
  })
})
