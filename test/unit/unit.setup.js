import { config } from '@vue/test-utils'

config.global.mocks = {
  $t: tKey => tKey,
}

config.global.directives = {
  tippy: {},
}

config.global.stubs = {
  FormKit: {
    template: '<div id="formkit-stub" />',
  },
}
