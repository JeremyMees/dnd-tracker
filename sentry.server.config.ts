import * as Sentry from '@sentry/nuxt'

Sentry.init({
  tracesSampleRate: 0.1,
  enableLogs: true,
  debug: false,
  enabled: !import.meta.dev,
})
