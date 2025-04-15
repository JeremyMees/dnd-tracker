<template>
  <div class="bg-muted/50 backdrop-blur-lg border-4 border-muted m-4 rounded-lg pt-10 pb-2">
    <div class="container-max px-4 flex flex-col gap-20">
      <div class="grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-y-10 gap-x-20">
        <NuxtLinkLocale
          to="/"
          class="mt-2"
        >
          <NuxtImg
            src="/text-logo.svg"
            alt="DnD Tracker logo"
            width="201"
            height="62"
          />
        </NuxtLinkLocale>
        <div class="mt-4 lg:mt-0">
          <p class="mb-4 head-3">
            {{ $t('components.navbar.contact') }}
          </p>
          <div class="flex flex-col gap-4">
            <NuxtLink
              to="mailto:jeremy@dnd-tracker.com"
              class="flex items-center"
            >
              <Icon
                name="tabler:mail"
                class="min-w-6 min-h-6 mr-2"
                aria-hidden="true"
              />
              Email
            </NuxtLink>
            <NuxtLinkLocale
              to="/contact"
              class="flex items-center"
            >
              <Icon
                name="tabler:forms"
                class="min-w-6 min-h-6 mr-2"
                aria-hidden="true"
              />
              Form
            </NuxtLinkLocale>
          </div>
        </div>
        <div>
          <p class="mb-4 head-3">
            {{ $t('components.navbar.socials') }}
          </p>
          <div class="flex flex-col gap-4">
            <NuxtLink
              to="https://www.instagram.com/dnd.tracker/"
              target="_blank"
              class="flex items-center"
            >
              <Icon
                name="tabler:brand-instagram"
                class="min-w-6 min-h-6 mr-2"
                aria-hidden="true"
              />
              Instagram
            </NuxtLink>
            <NuxtLink
              to="https://bsky.app/profile/lilmees.bsky.social"
              target="_blank"
              class="flex items-center"
            >
              <Icon
                name="tabler:brand-bluesky"
                class="min-w-6 min-h-6 mr-2"
                aria-hidden="true"
              />
              Bluesky
            </NuxtLink>
            <NuxtLink
              to="https://ko-fi.com/jeremymees"
              target="_blank"
              class="flex items-center"
            >
              <Icon
                name="tabler:coffee"
                class="min-w-6 min-h-6 mr-2"
                aria-hidden="true"
              />
              Kofi
            </NuxtLink>
          </div>
        </div>
        <div>
          <p class="mb-4 head-3">
            {{ $t('components.navbar.updates') }}
          </p>
          <div class="flex flex-col gap-4">
            <NuxtLinkLocale
              to="/updates/feature-request"
              class="flex items-center"
            >
              <Icon
                name="tabler:git-pull-request"
                class="min-w-6 min-h-6 mr-2"
                aria-hidden="true"
              />
              {{ $t('components.navbar.featureRequest') }}
            </NuxtLinkLocale>
            <NuxtLinkLocale
              to="/updates/changelog"
              class="flex items-center"
            >
              <Icon
                name="tabler:bolt"
                class="min-w-6 min-h-6 mr-2"
                aria-hidden="true"
              />
              {{ $t('components.navbar.changelog') }}
            </NuxtLinkLocale>
            <YbugButton type="footer" />
          </div>
        </div>
        <div>
          <p class="mb-4 head-3">
            {{ $t('components.navbar.policies') }}
          </p>
          <div class="flex flex-col gap-4">
            <NuxtLinkLocale
              to="/policies/cookie"
              class="flex items-center"
            >
              <Icon
                name="tabler:cookie"
                class="min-w-6 min-h-6 mr-2"
                aria-hidden="true"
              />
              {{ $t('components.navbar.cookie') }}
            </NuxtLinkLocale>
            <NuxtLinkLocale
              to="/policies/privacy"
              class="flex items-center"
            >
              <Icon
                name="tabler:spy"
                class="min-w-6 min-h-6 mr-2"
                aria-hidden="true"
              />
              {{ $t('components.navbar.privacy') }}
            </NuxtLinkLocale>
            <NuxtLinkLocale
              to="/policies/legal"
              class="flex items-center"
            >
              <Icon
                name="tabler:gavel"
                class="min-w-6 min-h-6 mr-2"
                aria-hidden="true"
              />
              {{ $t('components.navbar.legal') }}
            </NuxtLinkLocale>
          </div>
        </div>
      </div>
      <div class="flex flex-wrap justify-between gap-x-20 gap-y-4">
        <NuxtLink
          to="https://www.instagram.com/mount_lazarus/"
          target="_blank"
          class="text-muted-foreground body-small"
        >
          {{ $t('components.footer.illustrations') }} Mount Lazarus
        </NuxtLink>
        <p class="text-tertiary body-small">
          ©{{ new Date().getFullYear() }} dnd-tracker
        </p>
      </div>
    </div>
  </div>
</template>
