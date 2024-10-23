<script setup lang="ts">
const emit = defineEmits<{ change: [Avatar] }>()

const props = defineProps<{
  hideCreatorToggle?: boolean
  avatarBig?: boolean
  selectedOptions?: SelectedStyleOptions
}>()

const { t } = useI18n()
const avatarCreator = useAvatarCreator()
const creatorOpen = ref<boolean>(true)

onMounted(() => {
  if (props.selectedOptions) avatarCreator.update(props.selectedOptions)
  else avatarCreator.random()

  if (avatarCreator.avatar.value) {
    emit('change', avatarCreator.avatar.value)
  }
})

function updateAvatar(key: string, value: string): void {
  avatarCreator.update({ [key]: value })

  if (avatarCreator.avatar.value) {
    emit('change', avatarCreator.avatar.value)
  }
}
</script>

<template>
  <Card
    color="background"
    class="flex flex-col items-center justify-center"
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
    <div class="bg-primary/50 border-2 border-primary rounded-lg flex w-fit px-2 relative bottom-2 backdrop-blur">
      <button
        class="h-7 w-7 flex flex-col items-center justify-center outline-none"
        :class="{ 'border-r-2 border-primary pr-2': !hideCreatorToggle }"
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
        class="h-7 w-7 flex flex-col items-center justify-center outline-none pl-1"
        :aria-label="t('actions.random')"
        @click="creatorOpen = !creatorOpen"
      >
        <Icon
          name="ph:t-shirt"
          aria-hidden="true"
          class="w-4 h-4"
        />
      </button>
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
