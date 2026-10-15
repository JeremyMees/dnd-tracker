import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fileToAttachment, sendBugReport } from '~/utils/bug-report'

const { sendFeedback } = vi.hoisted(() => ({ sendFeedback: vi.fn() }))

vi.mock('@sentry/nuxt', () => ({ sendFeedback }))

const screenshot = new File(['image'], 'bug.png', { type: 'image/png' })

describe('bug-report utils', () => {
  beforeEach(() => {
    sendFeedback.mockReset().mockResolvedValue('event-id')
  })

  describe('fileToAttachment', () => {
    it('converts a file into a Sentry attachment', async () => {
      expect(await fileToAttachment(screenshot)).toEqual({
        filename: 'bug.png',
        data: new TextEncoder().encode('image'),
        contentType: 'image/png',
      })
    })
  })

  describe('sendBugReport', () => {
    it('sends the feedback without attachments when there is no screenshot', async () => {
      await sendBugReport({
        message: 'Something broke',
        name: 'aldric',
        email: 'aldric@example.com',
      })

      expect(sendFeedback).toHaveBeenCalledWith(
        {
          message: 'Something broke',
          name: 'aldric',
          email: 'aldric@example.com',
        },
        { attachments: [] },
      )
    })

    it('sends the screenshot as an attachment', async () => {
      await sendBugReport({ message: 'Something broke', screenshot })

      expect(sendFeedback).toHaveBeenCalledWith(
        { message: 'Something broke' },
        {
          attachments: [
            {
              filename: 'bug.png',
              data: new TextEncoder().encode('image'),
              contentType: 'image/png',
            },
          ],
        },
      )
    })

    it('returns the event id Sentry confirmed', async () => {
      await expect(sendBugReport({ message: 'Something broke' })).resolves.toBe(
        'event-id',
      )
    })

    it('rejects when Sentry could not store the feedback', async () => {
      sendFeedback.mockRejectedValue(new Error('Unable to send feedback'))

      await expect(
        sendBugReport({ message: 'Something broke' }),
      ).rejects.toThrow('Unable to send feedback')
    })
  })
})
