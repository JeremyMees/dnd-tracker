<script setup lang="ts">
const emit = defineEmits<{
  change: [Avatar]
  save: [Avatar]
}>()

const props = defineProps<{
  profile?: boolean
  deprecatedAvatar?: boolean
  hideCreatorToggle?: boolean
  avatarBig?: boolean
  selectedOptions?: SelectedStyleOptions
}>()

const { t } = useI18n()
const avatarCreator = useAvatarCreator()

const creatorOpen = ref<boolean>(props.hideCreatorToggle)

const isChanged = computed<boolean>(() => {
  if (!props.selectedOptions) return true

  const values = filterUnwantedKeys(props.selectedOptions)

  return Object.entries(values)
    .some(([key, value]) => {
      if (key.includes('Color')) {
        const hasHash = avatarCreator.options.value[key].toString().includes('#')

        return hasHash
          ? avatarCreator.options.value[key].toString().replace('#', '') !== value
          : avatarCreator.options.value[key] !== value
      }
      else {
        return avatarCreator.options.value[key] !== value
      }
    })
})

onMounted(() => {
  if (props.selectedOptions) avatarCreator.update(props.selectedOptions)
  else avatarCreator.random()

  if (avatarCreator.avatar.value) {
    emit('change', avatarCreator.avatar.value)
  }
})

function filterUnwantedKeys(selected: SelectedStyleOptions): SelectedStyleOptions {
  const values: SelectedStyleOptions = {}

  for (const key in selected) {
    if (avatarCreator.blackListedKeys.includes(key)) continue

    let value = selected[key]

    if (typeof value === 'string' && value.includes('#')) {
      value = value.replace('#', '')
    }

    if (key === 'primaryBackgroundColor') {
      values.backgroundColor = value
    }
    else values[key] = value
  }

  return values
}

function updateAvatar(key: string, value: string): void {
  avatarCreator.update({ [key]: value })

  if (avatarCreator.avatar.value) {
    emit('change', avatarCreator.avatar.value)
  }
}

function save(): void {
  if (avatarCreator.avatar.value) {
    emit('save', avatarCreator.avatar.value)
    creatorOpen.value = false
  }
}
</script>

<template>
  <Card
    color="background"
    class="flex flex-col items-center justify-center"
    :class="{
      'max-w-prose': profile,
    }"
  >
    <Card
      round
      no-padding
      color="primary"
      class="overflow-hidden min-w-[100px] max-w-[100px] h-[100px]"
      :class="{
        'lg:min-w-[200px] lg:max-w-[200px] lg:h-[200px]': avatarBig,
      }"
    >
      <AnimationReveal reverse>
        <img
          v-if="avatarCreator.avatar.value"
          :src="avatarCreator.avatar.value.url"
          loading="eager"
          alt="Avatar"
          class="w-full h-full rounded-full"
        >
      </AnimationReveal>
    </Card>
    <div class="bg-primary/50 border-2 border-primary rounded-lg flex w-fit relative bottom-2 backdrop-blur">
      <button
        v-tippy="t('actions.random')"
        class="h-7 w-7 flex flex-col items-center justify-center outline-none"
        :class="{ 'border-r-2 border-primary': !hideCreatorToggle }"
        :aria-label="t('actions.random')"
        @click="avatarCreator.random()"
      >
        <Icon
          name="la:random"
          aria-hidden="true"
          class="w-4 h-4"
        />
      </button>
      <button
        v-if="!hideCreatorToggle"
        v-tippy="t('components.avatarPicker.options')"
        :aria-label="t('components.avatarPicker.options')"
        class="h-7 w-7 flex flex-col items-center justify-center outline-none"
        :class="{ 'border-r-2 border-primary': profile }"
        @click="creatorOpen = !creatorOpen"
      >
        <Icon
          name="ph:t-shirt"
          aria-hidden="true"
          class="w-4 h-4"
        />
      </button>
      <template v-if="profile && isChanged && avatarCreator.avatar.value">
        <button
          v-if="props.selectedOptions"
          v-tippy="t('actions.reset')"
          class="h-7 w-7 flex flex-col items-center justify-center outline-none border-r-2 border-primary"
          :aria-label="t('actions.reset')"
          @click="() => {
            if (props.selectedOptions) avatarCreator.update(props.selectedOptions)
            creatorOpen = false
          }"
        >
          <Icon
            name="carbon:reset"
            aria-hidden="true"
            class="w-4 h-4 text-danger"
          />
        </button>
        <button
          v-tippy="t('actions.save')"
          class="h-7 w-7 flex flex-col items-center justify-center outline-none"
          :aria-label="t('actions.save')"
          @click="save"
        >
          <Icon
            name="ic:outline-save"
            aria-hidden="true"
            class="w-4 h-4 text-success"
          />
        </button>
      </template>
    </div>
    <div
      v-if="deprecatedAvatar"
      class="text-danger text-xs mt-1"
    >
      {{ t('components.avatarPicker.deprecated') }}
    </div>
    <AnimationExpand>
      <div
        v-if="creatorOpen"
        class="flex flex-wrap items-center justify-center gap-1 pt-4"
      >
        <AvatarSelector
          v-for="[key, option] in Object.entries(avatarCreator.configStyleOptions)"
          :key="key"
          :identifier="key"
          :options="option.values"
          :selected="avatarCreator.options.value[key]?.toString().replace('#', '')"
          @update="updateAvatar(key, $event)"
        />
      </div>
    </AnimationExpand>
  </Card>
</template>
