import * as Sentry from '@sentry/nuxt'
import { dataCollection } from './constants/sentry'

Sentry.init({
  dsn: useRuntimeConfig().public.sentry.dsn,
  tracesSampleRate: 0.1,
  dataCollection,
  integrations: [
    Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
  ],
  debug: false,
  enabled: !import.meta.dev,
})
