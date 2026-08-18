import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, afterEach } from 'vitest'
import ConfirmDialog from '~/components/atoms/ConfirmDialog.vue'

const props = {
  uuid: 'test-uuid',
  title: 'Test Title',
  description: 'Test Description',
  confirmText: 'Confirm',
  declineText: 'Decline',
  callback: vi.fn(),
}

describe('ConfirmDialog', async () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(ConfirmDialog, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render title, description and button text', async () => {
    await mountSuspended(ConfirmDialog, { props })

    expect(document.body.textContent).toContain('Test Title')
    expect(document.body.textContent).toContain('Test Description')
    expect(document.body.textContent).toContain('Confirm')
    expect(document.body.textContent).toContain('Decline')
  })

  it('Should be open when closing is not provided', async () => {
    await mountSuspended(ConfirmDialog, { props })

    expect(document.body.querySelector('[role="alertdialog"]')).toBeTruthy()
  })

  it('Should be open when closing is false', async () => {
    await mountSuspended(ConfirmDialog, {
      props: { ...props, closing: false },
    })

    expect(document.body.querySelector('[role="alertdialog"]')).toBeTruthy()
  })

  it('Should be closed when closing is true', async () => {
    await mountSuspended(ConfirmDialog, {
      props: { ...props, closing: true },
    })

    expect(document.body.querySelector('[role="alertdialog"]')).toBeFalsy()
  })

  it('Should emit decline with uuid when decline button is clicked', async () => {
    const component = await mountSuspended(ConfirmDialog, { props })

    const button = document.body.querySelector(
      '[test-id="decline-button"]',
    ) as HTMLButtonElement
    button.click()
    await nextTick()

    expect(component.emitted('decline')).toEqual([['test-uuid']])
  })

  it('Should emit confirm with uuid when confirm button is clicked', async () => {
    const component = await mountSuspended(ConfirmDialog, { props })

    const button = document.body.querySelector(
      '[test-id="confirm-button"]',
    ) as HTMLButtonElement
    button.click()
    await nextTick()

    expect(component.emitted('confirm')).toEqual([['test-uuid']])
  })
})
