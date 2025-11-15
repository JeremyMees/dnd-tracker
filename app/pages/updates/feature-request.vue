<script setup lang='ts'>
import { useFeatureListing, useFeatureVote } from '~~/queries/features'

useSeo('Feature request')

const { user } = useAuthentication()
const localePath = useLocalePath()
const modal = useModal()

const search = ref<string>('')
const debouncedSearch = refDebounced(search, 500, { maxWait: 1000 })
const createdBy = ref<'all' | 'my'>('all')
const page = ref<number>(0)

const { mutateAsync: vote } = useFeatureVote()

const { data, status } = useFeatureListing(computed(() => ({
  search: debouncedSearch.value,
  sortBy: 'created_at',
  sortDesc: true,
  page: page.value,
  eq: user.value && createdBy.value === 'my'
    ? { field: 'created_by', value: user.value.id }
    : undefined,
})))
</script>

<template>
  <NuxtLayout
    shadow
    container
  >
    <section class="max-w-4xl mx-auto w-full space-y-6">
      <Card
        color="secondary"
        class="flex flex-wrap items-center gap-x-4 gap-y-2"
      >
        <div class="space-y-2 flex-1">
          <UiLabel for="search">
            {{ $t('actions.search') }}
          </UiLabel>
          <UiInputGroup>
            <UiInputGroupInput
              id="search"
              v-model="search"
              name="search"
              type="search"
              :disabled="status === 'pending'"
            />
            <UiInputGroupAddon align="inline-end">
              <Icon
                name="tabler:search"
                class="size-3"
                :aria-hidden="true"
              />
            </UiInputGroupAddon>
          </UiInputGroup>
        </div>
        <div class="flex-1">
          <UiLabel>
            {{ $t('pages.featureRequest.filter.title') }}
          </UiLabel>
          <UiSelect
            v-model="createdBy"
            :disabled="status === 'pending'"
          >
            <UiSelectTrigger>
              <UiSelectValue />
            </UiSelectTrigger>
            <UiSelectContent>
              <UiSelectGroup>
                <UiSelectItem
                  v-for="option in [
                    { label: $t('pages.featureRequest.filter.options.my'), value: 'my' },
                    { label: $t('pages.featureRequest.filter.options.all'), value: 'all' },
                  ]"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </UiSelectItem>
              </UiSelectGroup>
            </UiSelectContent>
          </UiSelect>
        </div>
        <UiButton
          :aria-label="$t('pages.featureRequest.request')"
          :disabled="status === 'pending'"
          class="mt-5"
          @click="
            user
              ? modal.open({
                component: 'FeatureRequest',
                header: $t('components.addFeatureRequestModal.title'),
              })
              : navigateTo(localePath('/login'))
          "
        >
          {{ $t('pages.featureRequest.request') }}
        </UiButton>
      </Card>

      <!-- Loading feature request -->
      <div
        v-if="status === 'pending' && !data?.features?.length"
        class="flex flex-col gap-4"
      >
        <SkeletonFeatureRequestCard
          v-for="i in 2"
          :key="i"
        />
      </div>
      <template v-else-if="data?.features?.length">
        <!-- Feature requests -->
        <div
          v-if="data?.features?.length"
          class="flex flex-col gap-4"
        >
          <template
            v-for="feature in data.features"
            :key="feature.id"
          >
            <FeatureRequestCard
              v-if="
                feature.status !== 'review'
                  || (feature.status === 'review' && feature.created_by.id === user?.id)
              "
              :feature="feature"
              @update="vote({ id: feature.id, votes: $event })"
              @login="navigateTo(localePath('/login'))"
            />
          </template>

          <Pagination
            v-if="data?.pages > 1"
            v-model:page="page"
            :pages="data.pages"
            :per-page="10"
            styles="bg-secondary/50 border-4 border-secondary px-4 py-2 rounded-lg"
            class="mt-2 mx-auto"
            @paginate="(newPage) => {
              page = newPage
              scrollToId('el')
            }"
          />
        </div>
        <!-- Nothing found while sorting -->
        <div
          v-else-if="data?.features?.length === 0 && (search || createdBy === 'my')"
          class="flex flex-col justify-center gap-4 border-4 border-secondary bg-secondary/50 rounded-lg p-4"
        >
          <p>
            {{ $t('pages.featureRequest.nothing') }}
          </p>
        </div>
      </template>
      <!-- No feature request found -->
      <div
        v-else-if="data?.features?.length === 0 && (!search || createdBy === 'all')"
        class="flex flex-col justify-center gap-4 border-4 border-secondary bg-secondary/50 rounded-lg p-4"
      >
        <h3 class="pb-2">
          {{ $t('pages.featureRequest.cta.title') }}
        </h3>
        <p>
          {{ $t('pages.featureRequest.cta.text') }}
        </p>
      </div>
    </section>
  </NuxtLayout>
</template>
