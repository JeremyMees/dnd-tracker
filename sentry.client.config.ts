import * as Sentry from '@sentry/nuxt'
import { dataCollection } from './constants/sentry'
import { getAuthFailure } from './shared/utils/errors'

Sentry.init({
  dsn: useRuntimeConfig().public.sentry.dsn,
  tracesSampleRate: 0.1,
  dataCollection,
  beforeSend: (event, hint) =>
    getAuthFailure(hint.originalException) ? null : event,
  integrations: [
    Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
  ],
  debug: false,
  enabled: !import.meta.dev,
})
