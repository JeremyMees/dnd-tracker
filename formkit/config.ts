import { createProPlugin, inputs } from '@formkit/pro'
import { defineFormKitConfig } from '@formkit/vue'
import { generateClasses } from '@formkit/themes'
import { en, nl } from '@formkit/i18n'
import { createMultiStepPlugin } from '@formkit/addons'
import '@formkit/addons/css/multistep'

import theme from './theme'
import { createAsteriskPlugin, createIconMessagePlugin } from './plugins'

export default defineFormKitConfig((): any => {
  const key = useRuntimeConfig().public.formkit

  return {
    plugins: [
      createProPlugin(key, inputs),
      createMultiStepPlugin(),
      createAsteriskPlugin(),
      createIconMessagePlugin(),
    ],
    iconLoaderUrl: (iconName: string) => `https://api.iconify.design/${iconName}.svg`,
    locales: { en, nl },
    locale: 'nl',
    config: {
      classes: generateClasses(theme),
    },
  }
})
