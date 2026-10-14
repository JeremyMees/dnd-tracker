import * as Sentry from '@sentry/nuxt'
import { dataCollection } from './constants/sentry'

Sentry.init({
  tracesSampleRate: 0.1,
  dataCollection,
  debug: false,
  enabled: !import.meta.dev,
})
