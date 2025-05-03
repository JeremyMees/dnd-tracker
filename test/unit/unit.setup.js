import { config } from '@vue/test-utils'

config.global.mocks = {
  $t: tKey => tKey,
}

config.global.directives = {
  tippy: {},
}
