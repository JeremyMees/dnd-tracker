import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ModalGroup from '~/components/templates/ModalGroup.vue'

const featureRequestStub = { template: '<div test-id="feature-request" />' }
const campaignStub = { template: '<div test-id="campaign" />' }
const encounterStub = {
  props: ['encounter', 'campaignId'],
  template: '<div test-id="encounter" />',
}
const transferOwnershipStub = {
  template: '<div test-id="transfer-ownership" />',
}
const inviteMemberStub = { template: '<div test-id="invite-member" />' }
const homebrewStub = { template: '<div test-id="homebrew" />' }
const noteStub = { template: '<div test-id="note" />' }
const mailStub = { template: '<div test-id="mail" />' }

vi.mock('~/components/modal/FeatureRequest.vue', () => ({
  default: featureRequestStub,
}))
vi.mock('~/components/modal/Campaign.vue', () => ({ default: campaignStub }))
vi.mock('~/components/modal/Encounter.vue', () => ({ default: encounterStub }))
vi.mock('~/components/modal/TransferOwnership.vue', () => ({
  default: transferOwnershipStub,
}))
vi.mock('~/components/modal/InviteMember.vue', () => ({
  default: inviteMemberStub,
}))
vi.mock('~/components/modal/Homebrew.vue', () => ({ default: homebrewStub }))
vi.mock('~/components/modal/Note.vue', () => ({ default: noteStub }))
vi.mock('~/components/modal/Mail.vue', () => ({ default: mailStub }))

const modalsRef = ref<Modal[]>([])
const closeMock = vi.fn()

vi.mock('~/composables/useModal', () => ({
  useModal: () => ({ modals: modalsRef, close: closeMock }),
}))

function openModal(modal: Omit<Modal, 'uuid'> & { uuid?: string }): string {
  const uuid = modal.uuid ?? `${modalsRef.value.length + 1}`

  modalsRef.value = [...modalsRef.value, { ...modal, uuid }]

  return uuid
}

async function mount(): Promise<Awaited<ReturnType<typeof mountSuspended>>> {
  const component = await mountSuspended(ModalGroup, {
    attachTo: document.body,
  })
  await flushPromises()

  return component
}

describe('ModalGroup', () => {
  beforeEach(() => {
    modalsRef.value = []
    closeMock.mockClear()
  })

  it('Should render nothing when there are no open modals', async () => {
    const component = await mount()

    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
    component.unmount()
  })

  it('Should render the matching component for each modal type', async () => {
    openModal({ component: 'FeatureRequest', header: 'FeatureRequest' })
    openModal({ component: 'Campaign', header: 'Campaign' })
    openModal({ component: 'Encounter', header: 'Encounter' })
    openModal({ component: 'TransferOwnership', header: 'TransferOwnership' })
    openModal({ component: 'InviteMember', header: 'InviteMember' })
    openModal({ component: 'Homebrew', header: 'Homebrew' })
    openModal({ component: 'Note', header: 'Note' })
    openModal({ component: 'Mail', header: 'Mail' })

    const component = await mount()

    expect(
      document.body.querySelector('[test-id="feature-request"]'),
    ).not.toBeNull()
    expect(document.body.querySelector('[test-id="campaign"]')).not.toBeNull()
    expect(document.body.querySelector('[test-id="encounter"]')).not.toBeNull()
    expect(
      document.body.querySelector('[test-id="transfer-ownership"]'),
    ).not.toBeNull()
    expect(
      document.body.querySelector('[test-id="invite-member"]'),
    ).not.toBeNull()
    expect(document.body.querySelector('[test-id="homebrew"]')).not.toBeNull()
    expect(document.body.querySelector('[test-id="note"]')).not.toBeNull()
    expect(document.body.querySelector('[test-id="mail"]')).not.toBeNull()
    component.unmount()
  })

  it('Should forward the header, subHeader and variant to the Modal', async () => {
    openModal({
      component: 'Note',
      header: 'My header',
      subHeader: 'My sub header',
      variant: 'big',
    })

    const component = await mount()

    expect(document.body.textContent).toContain('My header')
    expect(document.body.textContent).toContain('My sub header')
    expect(document.body.querySelector('[role="dialog"]')?.className).toContain(
      'max-w-[1000px]',
    )
    component.unmount()
  })

  it('Should forward props to the dynamic component', async () => {
    openModal({
      component: 'Encounter',
      header: 'Encounter',
      props: { encounter: { id: 1 }, campaignId: 5 },
    })

    const component = await mount()
    const encounter = component.findComponent(encounterStub)

    expect(encounter.props('encounter')).toEqual({ id: 1 })
    expect(encounter.props('campaignId')).toBe(5)
    component.unmount()
  })

  it('Should forward events to the dynamic component', async () => {
    const onCustom = vi.fn()

    openModal({
      component: 'Note',
      header: 'Note',
      events: { custom: onCustom },
    })

    const component = await mount()
    const note = component.findComponent(noteStub)
    await note.vm.$emit('custom', 'payload')

    expect(onCustom).toHaveBeenCalledWith('payload')
    component.unmount()
  })

  it('Should call close with the modal uuid when the dynamic component emits close', async () => {
    const uuid = openModal({ component: 'Note', header: 'Note' })

    const component = await mount()
    const note = component.findComponent(noteStub)
    await note.vm.$emit('close')

    expect(closeMock).toHaveBeenCalledWith(uuid)
    component.unmount()
  })

  it('Should call close with the modal uuid when the Modal itself emits close', async () => {
    const uuid = openModal({ component: 'Note', header: 'Note' })

    const component = await mount()
    document.body
      .querySelector('[role="dialog"] button')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()

    expect(closeMock).toHaveBeenCalledWith(uuid)
    component.unmount()
  })
})
