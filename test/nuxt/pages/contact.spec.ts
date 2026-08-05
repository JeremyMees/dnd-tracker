import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Contact from '~/pages/contact.vue'
import { fillForm, submitForm } from '~~/test/nuxt/stubs/form'
import { nuxtLayoutStub } from '~~/test/nuxt/stubs/layout'

const { fetchMock, navigateTo, toast, useSeo } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  navigateTo: vi.fn(),
  toast: vi.fn(),
  useSeo: vi.fn(),
}))

vi.mock('~/components/ui/toast/use-toast', () => ({
  useToast: () => ({ toast }),
}))

mockNuxtImport('useSeo', () => useSeo)
mockNuxtImport('navigateTo', () => navigateTo)
mockNuxtImport('$fetch', () => fetchMock)

const stubs = { NuxtLayout: nuxtLayoutStub }
const question = { email: 'bilbo@shire.com', question: 'Where is my ring?' }

async function mountPage() {
  const component = await mountSuspended(Contact, { global: { stubs } })

  await flushPromises()

  return component
}

describe('Contact page', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    fetchMock.mockResolvedValue(undefined)
  })

  it('Should set the page seo', async () => {
    await mountPage()

    expect(useSeo).toHaveBeenCalledWith('Contact')
  })

  it('Should render inside the centered layout with the title', async () => {
    const component = await mountPage()

    expect(
      component.get('[data-test-layout]').attributes('data-test-layout'),
    ).toBe('centered')
    expect(component.get('[data-test-title]').text()).toBe(
      'pages.contact.title',
    )
  })

  it('Should render the form fields and the submit button', async () => {
    const component = await mountPage()

    expect(component.find('[data-test-name]').exists()).toBe(true)
    expect(component.find('[data-test-email]').exists()).toBe(true)
    expect(component.find('[data-test-question]').exists()).toBe(true)
    expect(component.get('[data-test-submit]').text()).toBe(
      'pages.contact.send',
    )
  })

  it('Should send the form values to the contact endpoint', async () => {
    const component = await mountPage()

    await fillForm(component, { ...question, name: 'Bilbo Baggins' })
    await submitForm(component)

    expect(fetchMock).toHaveBeenCalledWith('/api/emails/contact-request', {
      method: 'POST',
      body: { ...question, name: 'Bilbo Baggins' },
    })
  })

  it('Should send the form when the optional name is omitted', async () => {
    const component = await mountPage()

    await fillForm(component, question)
    await submitForm(component)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/emails/contact-request',
      expect.objectContaining({
        body: expect.objectContaining(question),
      }),
    )
  })

  it('Should show a success toast and redirect home when the request succeeds', async () => {
    const component = await mountPage()

    await fillForm(component, question)
    await submitForm(component)

    expect(toast).toHaveBeenCalledWith({
      description: 'pages.contact.success',
      variant: 'success',
    })
    expect(navigateTo).toHaveBeenCalledWith('/')
  })

  it('Should not send the form when the required fields are missing', async () => {
    const component = await mountPage()

    await submitForm(component)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(navigateTo).not.toHaveBeenCalled()
    expect(component.findAll('p.text-destructive')).toHaveLength(2)
  })

  it('Should not send the form when the email is invalid', async () => {
    const component = await mountPage()

    await fillForm(component, { ...question, email: 'not-an-email' })
    await submitForm(component)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('Should not send the form when the question is too short', async () => {
    const component = await mountPage()

    await fillForm(component, { ...question, question: 'no' })
    await submitForm(component)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('Should not send the form when the name is too short', async () => {
    const component = await mountPage()

    await fillForm(component, { ...question, name: 'Bo' })
    await submitForm(component)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('Should show a translated error when the name is not letters and spaces', async () => {
    const component = await mountPage()

    await fillForm(component, { ...question, name: 'Bilbo 123' })
    await submitForm(component)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(component.text()).toContain('zod.alphaSpaces')
  })

  it('Should show the error message and an error toast when the request fails', async () => {
    fetchMock.mockRejectedValue(new Error('Mail server exploded'))

    const component = await mountPage()

    await fillForm(component, question)
    await submitForm(component)

    expect(component.get('[data-test-error]').text()).toBe(
      'Mail server exploded',
    )
    expect(toast).toHaveBeenCalledWith({
      description: 'general.mail.fail.text',
      title: 'general.mail.fail.title',
      variant: 'destructive',
    })
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('Should fall back to a generic error when the request fails without a message', async () => {
    fetchMock.mockRejectedValue({})

    const component = await mountPage()

    await fillForm(component, question)
    await submitForm(component)

    expect(component.get('[data-test-error]').text()).toBe(
      'An error occurred during contact request',
    )
  })

  it('Should clear the previous error when the form is submitted again', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Mail server exploded'))

    const component = await mountPage()

    await fillForm(component, question)
    await submitForm(component)

    expect(component.find('[data-test-error]').exists()).toBe(true)

    await submitForm(component)

    expect(component.find('[data-test-error]').exists()).toBe(false)
  })
})
