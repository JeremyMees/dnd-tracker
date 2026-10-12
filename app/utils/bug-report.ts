import { sendFeedback } from '@sentry/nuxt'
import type { EventHint } from '@sentry/nuxt'

type BugReportAttachment = NonNullable<EventHint['attachments']>[number]

export interface BugReport {
  message: string
  name?: string
  email?: string
  screenshot?: File
}

export async function fileToAttachment(
  file: File,
): Promise<BugReportAttachment> {
  return {
    filename: file.name,
    data: new Uint8Array(await file.arrayBuffer()),
    contentType: file.type,
  }
}

export async function sendBugReport({
  screenshot,
  ...params
}: BugReport): Promise<string> {
  const attachments = screenshot ? [await fileToAttachment(screenshot)] : []

  return sendFeedback(params, { attachments })
}
