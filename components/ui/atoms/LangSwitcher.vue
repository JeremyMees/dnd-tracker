<script setup lang="ts">
import type { Dropdown } from '#components'

const { locale, locales } = useI18n({ useScope: 'global' })
const cookieLang = useCookie('lang')
const switchLocalePath = useSwitchLocalePath()
const router = useRouter()
const config: { locale: string } | undefined = inject(Symbol.for('FormKitConfig'))

const dropdown = ref<InstanceType<typeof Dropdown>>()

const currentLocale = computed(() => locales.value.find(l => l.code === locale.value))

onMounted(() => {
  if (cookieLang.value) setLang(cookieLang.value)
  else setLang(router.currentRoute.value.fullPath.includes('/en/') ? 'en' : 'nl')
})

function setLang(lang: string): void {
  cookieLang.value = lang
  locale.value = lang

  if (config) config.locale = lang
  if (dropdown.value) dropdown.value.close()
}
</script>

<template>
  <Dropdown
    ref="dropdown"
    color="gray"
    round
  >
    {{ currentLocale?.icon || locale }}
    <template #content>
      <NuxtLink
        v-for="language in locales"
        :key="language.code"
        :to="switchLocalePath(language.code)"
        class="flex gap-1"
        @click="setLang(language.code)"
      >
        {{ language.icon }} {{ language.name }}
      </NuxtLink>
    </template>
  </Dropdown>
</template>
