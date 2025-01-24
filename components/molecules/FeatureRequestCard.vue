<script setup lang="ts">
const emit = defineEmits<{
  update: [FeatureVotes]
  login: []
}>()

const props = defineProps<{ feature: FeatureRequest }>()

const { locale, t } = useI18n()
const profile = useProfile()

const date = computed<string>(() => {
  const dateString = new Date(props.feature.created_at)
  return dateString.toLocaleDateString(locale.value === 'nl' ? 'nl-NL' : 'en-US')
})

const hasVoted = computed<FeatureVote | undefined>(() => {
  if (!profile.data) return undefined
  else if (props.feature.voted.like.includes(profile.data.id)) return 'like'
  else if (props.feature.voted.dislike.includes(profile.data.id)) return 'dislike'
  else return undefined
})

function toggleVote(vote: FeatureVote): void {
  if (!profile.data) return

  if (hasVoted.value === vote) {
    props.feature.voted[vote] = props.feature.voted[vote].filter(id => id !== profile.data!.id)
  }
  else props.feature.voted[vote].push(profile.data.id)

  const reset: FeatureVote = vote === 'like' ? 'dislike' : 'like'
  props.feature.voted[reset] = props.feature.voted[reset].filter(id => id !== profile.data!.id)

  emit('update', props.feature.voted)
}
</script>

<template>
  <UiCard>
    <UiCardHeader>
      <UiCardTitle>
        <div class="flex items-center gap-x-2">
          <UiAvatar class="border-2 border-background">
            <UiAvatarImage
              v-tippy="feature.created_by.username"
              :src="feature.created_by.avatar"
              :alt="feature.created_by.username"
            />
            <UiAvatarFallback>
              <Icon
                name="tabler:user"
                class="size-6 min-w-6 text-muted-foreground"
              />
            </UiAvatarFallback>
          </UiAvatar>
          <h2>
            {{ feature.title }}
            <span class="body-extra-small ml-2 text-muted-foreground">
              {{ date }}
            </span>
          </h2>
        </div>
      </UiCardTitle>
    </UiCardHeader>
    <UiCardContent>
      <div class="flex gap-x-4 flex-1">
        <div class="flex flex-col gap-y-1">
          <button
            class="bg-background/50 border-4 border-background rounded-lg py-1 px-2 flex flex-col items-center"
            :class="{
              '!bg-primary/50 !border-primary': hasVoted === 'like',
            }"
            @click="profile.data ? toggleVote('like') : emit('login')"
          >
            <Icon
              name="tabler:thumb-up"
              aria-hidden="true"
            />
            <span class="font-bold text-xs">
              {{ feature.voted.like.length }}
            </span>
          </button>
          <button
            class="bg-background/50 border-4 border-background rounded-lg py-1 px-2 flex flex-col items-center"
            :class="{
              '!bg-primary/50 !border-primary': hasVoted === 'dislike',
            }"
            @click="profile.data ? toggleVote('dislike') : emit('login')"
          >
            <span class="font-bold text-xs">
              {{ feature.voted.dislike.length }}
            </span>
            <Icon
              name="tabler:thumb-down"
              aria-hidden="true"
            />
          </button>
        </div>

        <div class="flex flex-col flex-1 items-start justify-start gap-y-4">
          <div
            v-if="feature.status !== 'accepted'"
            class="body-small px-2 py-1 rounded-lg w-fit border-2"
            :class="{
              'bg-info/50 border-info': feature.status === 'review',
              'bg-success/50 border-success': feature.status === 'progress',
            }"
          >
            {{ t(`pages.featureRequest.status.${feature.status}`) }}
          </div>
          <p class="body-small">
            {{ feature.text }}
          </p>
        </div>
      </div>
    </UiCardContent>
  </UiCard>
</template>
