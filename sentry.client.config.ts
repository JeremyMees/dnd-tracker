import * as Sentry from '@sentry/nuxt'

Sentry.init({
  release: 'dnd-tracker@' + useRuntimeConfig().public.appVersion,
  dsn: useRuntimeConfig().public.sentry.dsn,
  tracesSampleRate: 0.1,
  enableLogs: true,
  integrations: [
    Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
  ],
  debug: false,
  enabled: !import.meta.dev,
})
