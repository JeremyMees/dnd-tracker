import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NoteModal from '~/components/modal/Note.vue'
import { mockNote } from '~~/test/fixtures/note'
import { submitForm } from '~~/test/nuxt/stubs/form'

const { createNote, updateNote } = vi.hoisted(() => ({
  createNote: vi.fn(),
  updateNote: vi.fn(),
}))

vi.mock('~/queries/notes', () => ({
  useNoteCreate: () => ({ mutateAsync: createNote }),
  useNoteUpdate: () => ({ mutateAsync: updateNote }),
}))

function mountNoteModal(note?: NoteRow) {
  return mountSuspended(NoteModal, {
    props: { campaignId: mockNote.campaign, note },
  })
}

function setText(
  component: Awaited<ReturnType<typeof mountNoteModal>>,
  text: string,
) {
  return component
    .findComponent({ name: 'TextEditor' })
    .vm.$emit('updated', text)
}

function createOptions() {
  return createNote.mock.calls[0]![0]
}

function updateOptions() {
  return updateNote.mock.calls[0]![0]
}

describe('Note modal', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    createNote.mockResolvedValue(undefined)
    updateNote.mockResolvedValue(undefined)
  })

  it('Should match snapshot', async () => {
    const component = await mountNoteModal()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should start empty without a note', async () => {
    const component = await mountNoteModal()

    expect(
      component.get<HTMLInputElement>('[test-id="title"]').element.value,
    ).toBe('')
    expect(component.get('[test-id="submit"]').text()).toBe(
      'components.noteModal.add',
    )
  })

  it('Should prefill the title and text when editing a note', async () => {
    const component = await mountNoteModal(mockNote)

    expect(
      component.get<HTMLInputElement>('[test-id="title"]').element.value,
    ).toBe(mockNote.title)
    expect(
      component.findComponent({ name: 'TextEditor' }).props('content'),
    ).toBe(mockNote.text)
    expect(component.get('[test-id="submit"]').text()).toBe(
      'components.noteModal.update',
    )
  })

  it('Should create a note for the given campaign', async () => {
    const component = await mountNoteModal()

    await component.get('[test-id="title"]').setValue('The tavern brawl')
    await setText(component, 'The party started a fight with the barkeep.')
    await submitForm(component)

    expect(createNote).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          title: 'The tavern brawl',
          text: 'The party started a fight with the barkeep.',
          campaign: mockNote.campaign,
        },
      }),
    )
    expect(updateNote).not.toHaveBeenCalled()
  })

  it('Should update an existing note', async () => {
    const component = await mountNoteModal(mockNote)

    await component.get('[test-id="title"]').setValue('The tavern truce')
    await submitForm(component)

    expect(updateNote).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockNote.id,
        data: expect.objectContaining({ title: 'The tavern truce' }),
      }),
    )
    expect(createNote).not.toHaveBeenCalled()
  })

  it('Should emit close when the mutation succeeds', async () => {
    const component = await mountNoteModal()

    await component.get('[test-id="title"]').setValue('The tavern brawl')
    await setText(component, 'The party started a fight with the barkeep.')
    await submitForm(component)

    createOptions().onSuccess()

    expect(component.emitted('close')).toBeTruthy()
  })

  it('Should emit close when an update succeeds', async () => {
    const component = await mountNoteModal(mockNote)

    await submitForm(component)

    updateOptions().onSuccess()

    expect(component.emitted('close')).toBeTruthy()
  })

  it('Should not submit when the title is too short', async () => {
    const component = await mountNoteModal()

    await component.get('[test-id="title"]').setValue('abcd')
    await setText(component, 'The party started a fight with the barkeep.')
    await submitForm(component)

    expect(createNote).not.toHaveBeenCalled()
  })

  it('Should not submit when the text is too short', async () => {
    const component = await mountNoteModal()

    await component.get('[test-id="title"]').setValue('The tavern brawl')
    await setText(component, 'too short')
    await submitForm(component)

    expect(createNote).not.toHaveBeenCalled()
    expect(component.text()).toContain('Too small')
  })

  it('Should show the error the mutation reports', async () => {
    const component = await mountNoteModal()

    await component.get('[test-id="title"]').setValue('The tavern brawl')
    await setText(component, 'The party started a fight with the barkeep.')
    await submitForm(component)

    createOptions().onError('Create failed')
    await nextTick()

    expect(component.get('[test-id="error"]').text()).toBe('Create failed')
  })

  it('Should show the error an update reports', async () => {
    const component = await mountNoteModal(mockNote)

    await submitForm(component)

    updateOptions().onError('Update failed')
    await nextTick()

    expect(component.get('[test-id="error"]').text()).toBe('Update failed')
  })
})
