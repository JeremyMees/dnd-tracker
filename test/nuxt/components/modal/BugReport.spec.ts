import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BugReportModal from '~/components/modal/BugReport.vue'
import { authUser } from '~~/test/fixtures/auth-user'
import { selectFile, submitForm } from '~~/test/nuxt/stubs/form'
import { maxBugReportScreenshotSize } from '~~/constants/validation'

const { sendBugReport, toast } = vi.hoisted(() => ({
  sendBugReport: vi.fn(),
  toast: vi.fn(),
}))

vi.mock('~/components/ui/toast', () => ({ useToast: () => ({ toast }) }))

mockNuxtImport('sendBugReport', () => sendBugReport)

const user = ref<AuthUser | null>({ ...authUser })

mockNuxtImport('useAuthentication', () => () => ({ user }))

const message = 'The initiative order resets when I refresh'
const screenshot = new File(['image'], 'bug.png', { type: 'image/png' })

function mountBugReportModal() {
  return mountSuspended(BugReportModal)
}

describe('Bug report modal', () => {
  beforeEach(() => {
    user.value = { ...authUser }
    sendBugReport.mockReset().mockResolvedValue('event-id')
    toast.mockReset()
  })

  it('Should match snapshot', async () => {
    const component = await mountBugReportModal()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should hide the email field for a logged in user', async () => {
    const component = await mountBugReportModal()

    expect(component.find('[test-id="message"]').exists()).toBe(true)
    expect(component.find('[test-id="screenshot"]').exists()).toBe(true)
    expect(component.find('[test-id="email"]').exists()).toBe(false)
  })

  it('Should show the email field for a guest', async () => {
    user.value = null

    const component = await mountBugReportModal()

    expect(component.find('[test-id="email"]').exists()).toBe(true)
  })

  it('Should send the report with the logged in user details', async () => {
    const component = await mountBugReportModal()

    await component.get('[test-id="message"]').setValue(message)
    await submitForm(component)

    expect(sendBugReport).toHaveBeenCalledWith({
      message,
      name: authUser.username,
      email: authUser.email,
      screenshot: undefined,
    })
  })

  it('Should send the report with the email a guest entered', async () => {
    user.value = null

    const component = await mountBugReportModal()

    await component.get('[test-id="message"]').setValue(message)
    await component.get('[test-id="email"]').setValue('guest@example.com')
    await submitForm(component)

    expect(sendBugReport).toHaveBeenCalledWith({
      message,
      name: undefined,
      email: 'guest@example.com',
      screenshot: undefined,
    })
  })

  it('Should send the report without an email when a guest leaves it empty', async () => {
    user.value = null

    const component = await mountBugReportModal()

    await component.get('[test-id="message"]').setValue(message)
    await submitForm(component)

    expect(sendBugReport).toHaveBeenCalledWith(
      expect.objectContaining({ email: undefined }),
    )
  })

  it('Should send the selected screenshot', async () => {
    const component = await mountBugReportModal()

    await component.get('[test-id="message"]').setValue(message)
    await selectFile(component, '[test-id="screenshot"]', screenshot)
    await submitForm(component)

    expect(sendBugReport).toHaveBeenCalledWith(
      expect.objectContaining({ screenshot }),
    )
  })

  it('Should show a toast and close after the report was sent', async () => {
    const component = await mountBugReportModal()

    await component.get('[test-id="message"]').setValue(message)
    await submitForm(component)

    expect(toast).toHaveBeenCalledWith({
      title: 'components.bugReportModal.success.title',
      description: 'components.bugReportModal.success.text',
      variant: 'success',
    })
    expect(component.emitted('close')).toBeTruthy()
  })

  it('Should show an error and stay open when sending fails', async () => {
    sendBugReport.mockRejectedValue(new Error('Unable to send feedback'))

    const component = await mountBugReportModal()

    await component.get('[test-id="message"]').setValue(message)
    await submitForm(component)

    expect(component.get('[test-id="error"]').text()).toBe(
      'components.bugReportModal.errors.send',
    )
    expect(toast).not.toHaveBeenCalled()
    expect(component.emitted('close')).toBeFalsy()
  })

  it('Should not submit when the message is too short', async () => {
    const component = await mountBugReportModal()

    await component.get('[test-id="message"]').setValue('broken')
    await submitForm(component)

    expect(sendBugReport).not.toHaveBeenCalled()
  })

  it('Should not submit when a guest enters an invalid email', async () => {
    user.value = null

    const component = await mountBugReportModal()

    await component.get('[test-id="message"]').setValue(message)
    await component.get('[test-id="email"]').setValue('not-an-email')
    await submitForm(component)

    expect(sendBugReport).not.toHaveBeenCalled()
  })

  it('Should reject a screenshot that is not an image', async () => {
    const component = await mountBugReportModal()

    await component.get('[test-id="message"]').setValue(message)
    await selectFile(
      component,
      '[test-id="screenshot"]',
      new File(['%PDF'], 'bug.pdf', { type: 'application/pdf' }),
    )
    await submitForm(component)

    expect(sendBugReport).not.toHaveBeenCalled()
    expect(component.text()).toContain(
      'components.bugReportModal.errors.screenshotType',
    )
  })

  it('Should reject a screenshot that is too large', async () => {
    const component = await mountBugReportModal()

    const largeScreenshot = new File(['image'], 'bug.png', {
      type: 'image/png',
    })
    Object.defineProperty(largeScreenshot, 'size', {
      value: maxBugReportScreenshotSize + 1,
    })

    await component.get('[test-id="message"]').setValue(message)
    await selectFile(component, '[test-id="screenshot"]', largeScreenshot)
    await submitForm(component)

    expect(sendBugReport).not.toHaveBeenCalled()
    expect(component.text()).toContain(
      'components.bugReportModal.errors.screenshotSize',
    )
  })

  it('Should send without a screenshot after the selection is cleared', async () => {
    const component = await mountBugReportModal()

    await component.get('[test-id="message"]').setValue(message)
    await selectFile(component, '[test-id="screenshot"]', screenshot)
    await selectFile(component, '[test-id="screenshot"]', null)
    await submitForm(component)

    expect(sendBugReport).toHaveBeenCalledWith(
      expect.objectContaining({ screenshot: undefined }),
    )
  })
})
