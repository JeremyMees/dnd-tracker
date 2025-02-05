<script setup lang='ts'>
useSeo('Feature request')

const features = useFeatures()
const { user } = useAuthentication()
const localePath = useLocalePath()
const modal = useModal()

const createdBy = ref<'all' | 'my'>('all')
const search = ref<string>('')
const page = ref<number>(0)

const { data: requests, status, refresh } = await useAsyncData(
  'feature-requests',
  async () => await features.get({
    page: page.value,
    search: search.value,
    sortBy: 'created_at',
  }, user.value && createdBy.value === 'my'
    ? {
        field: 'created_by',
        value: user.value.id,
      }
    : undefined), {
    watch: [createdBy, page],
  },
)

watchDebounced(
  search,
  () => refresh(),
  { debounce: 500, maxWait: 1000 },
)

async function vote(id: number, vote: FeatureVotes): Promise<void> {
  await features.vote(id, vote)
  refresh()
}

function paginate(newPage: number): void {
  page.value = newPage
  scrollToId('el')
}

function routeToLogin(): void {
  navigateTo(localePath('/login'))
}
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
        <FormKit
          v-model="search"
          type="search"
          name="search"
          :label="$t('components.inputs.titleLabel')"
          outer-class="$reset grow !pb-0"
        />
        <FormKit
          v-if="user"
          v-model="createdBy"
          :disabled="status === 'pending'"
          :label="$t('pages.featureRequest.filter.title')"
          name="created by"
          type="select"
          :options="[
            { label: $t('pages.featureRequest.filter.options.my'), value: 'my' },
            { label: $t('pages.featureRequest.filter.options.all'), value: 'all' },
          ]"
          outer-class="$reset !pb-0"
        />
        <button
          class="btn-primary mt-5"
          :aria-label="$t('pages.featureRequest.request')"
          :disabled="status === 'pending'"
          @click="
            user
              ? modal.open({
                component: 'FeatureRequest',
                header: $t('components.addFeatureRequestModal.title'),
                submit: $t('actions.create'),
                events: { finished: () => refresh() },
              })
              : routeToLogin()
          "
        >
          {{ $t('pages.featureRequest.request') }}
        </button>
      </Card>

      <!-- Loading feature request -->
      <div
        v-if="status === 'pending' && !requests?.length"
        class="flex flex-col gap-4"
      >
        <SkeletonFeatureRequestCard
          v-for="i in 2"
          :key="i"
        />
      </div>
      <template v-else-if="requests?.length">
        <!-- Feature requests -->
        <div
          v-if="requests?.length"
          class="flex flex-col gap-4"
        >
          <template
            v-for="feature in requests"
            :key="feature.id"
          >
            <FeatureRequestCard
              v-if="
                feature.status !== 'review'
                  || (feature.status === 'review' && feature.created_by.id === user?.id)
              "
              :feature="feature"
              @update="vote(feature.id, $event)"
              @login="routeToLogin"
            />
          </template>

          <Pagination
            v-if="features.pages > 1"
            v-model:page="page"
            :pages="features.pages"
            :per-page="features.perPage"
            styled
            class="mt-2 mx-auto"
            @paginate="paginate"
          />
        </div>
        <!-- Nothing found while sorting -->
        <div
          v-else-if="requests.length === 0 && (search || createdBy === 'my')"
          class="flex flex-col justify-center gap-4 border-4 border-secondary bg-secondary/50 rounded-lg p-4"
        >
          <p>
            {{ $t('pages.featureRequest.nothing') }}
          </p>
        </div>
      </template>
      <!-- No feature request found -->
      <div
        v-else-if="requests?.length === 0 && (!search || createdBy === 'all')"
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
