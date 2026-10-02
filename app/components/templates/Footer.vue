<template>
  <div class="container-max px-4 pb-2 flex flex-col gap-10">
    <NuxtLinkLocale
      to="/"
      test-id="footer-home"
      :aria-label="$t('components.navbar.home')"
    >
      <NuxtImg
        src="/text-logo-light.svg"
        alt="DnD Tracker logo"
        width="201"
        height="62"
        class="w-full hidden dark:block"
      />
      <NuxtImg
        src="/text-logo-dark.svg"
        alt="DnD Tracker logo"
        width="201"
        height="62"
        class="w-full block dark:hidden"
      />
    </NuxtLinkLocale>
    <UiSeparator class="bg-border" />
    <div class="grid sm:grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-20 w-fit">
      <div class="mt-4 lg:mt-0">
        <p class="mb-3 text-sm font-semibold">
          {{ $t('components.navbar.contact') }}
        </p>
        <div class="flex flex-col gap-2">
          <NuxtLink
            to="mailto:jeremy@dnd-tracker.com"
            class="flex items-center text-sm"
            test-id="footer-email"
          >
            <Icon
              name="tabler:mail"
              class="min-w-4 min-h-4 mr-2 text-muted-foreground"
              aria-hidden="true"
            />
            Email
          </NuxtLink>
          <NuxtLinkLocale
            to="/contact"
            class="flex items-center text-sm"
            test-id="footer-contact"
          >
            <Icon
              name="tabler:forms"
              class="min-w-4 min-h-4 mr-2 text-muted-foreground"
              aria-hidden="true"
            />
            Form
          </NuxtLinkLocale>
        </div>
      </div>
      <div>
        <p class="mb-3 text-sm font-semibold">
          {{ $t('components.navbar.socials') }}
        </p>
        <div class="flex flex-col gap-2">
          <NuxtLink
            to="https://www.instagram.com/dnd.tracker/"
            target="_blank"
            class="flex items-center text-sm"
            test-id="footer-instagram"
          >
            <Icon
              name="tabler:brand-instagram"
              class="min-w-4 min-h-4 mr-2 text-muted-foreground"
              aria-hidden="true"
            />
            Instagram
          </NuxtLink>
          <NuxtLink
            to="https://bsky.app/profile/lilmees.bsky.social"
            target="_blank"
            class="flex items-center text-sm"
            test-id="footer-bluesky"
          >
            <Icon
              name="tabler:brand-bluesky"
              class="min-w-4 min-h-4 mr-2 text-muted-foreground"
              aria-hidden="true"
            />
            Bluesky
          </NuxtLink>
          <NuxtLink
            to="https://ko-fi.com/jeremymees"
            target="_blank"
            class="flex items-center text-sm"
            test-id="footer-kofi"
          >
            <Icon
              name="tabler:coffee"
              class="min-w-4 min-h-4 mr-2 text-muted-foreground"
              aria-hidden="true"
            />
            Kofi
          </NuxtLink>
        </div>
      </div>
      <div>
        <p class="mb-3 text-sm font-semibold">
          {{ $t('components.navbar.updates') }}
        </p>
        <div class="flex flex-col gap-2">
          <NuxtLinkLocale
            to="/updates/feature-request"
            class="flex items-center text-sm"
            test-id="footer-feature-request"
          >
            <Icon
              name="tabler:git-pull-request"
              class="min-w-4 min-h-4 mr-2 text-muted-foreground"
              aria-hidden="true"
            />
            {{ $t('components.navbar.featureRequest') }}
          </NuxtLinkLocale>
          <NuxtLinkLocale
            to="/updates/changelog"
            class="flex items-center text-sm"
            test-id="footer-changelog"
          >
            <Icon
              name="tabler:bolt"
              class="min-w-4 min-h-4 mr-2 text-muted-foreground"
              aria-hidden="true"
            />
            {{ $t('components.navbar.changelog') }}
          </NuxtLinkLocale>
          <YbugButton type="footer" />
        </div>
      </div>
      <div>
        <p class="mb-3 text-sm font-semibold">
          {{ $t('components.navbar.policies') }}
        </p>
        <div class="flex flex-col gap-2">
          <NuxtLinkLocale
            to="/policies/cookie"
            class="flex items-center text-sm"
            test-id="footer-cookie"
          >
            <Icon
              name="tabler:cookie"
              class="min-w-4 min-h-4 mr-2 text-muted-foreground"
              aria-hidden="true"
            />
            {{ $t('components.navbar.cookie') }}
          </NuxtLinkLocale>
          <NuxtLinkLocale
            to="/policies/privacy"
            class="flex items-center text-sm"
            test-id="footer-privacy"
          >
            <Icon
              name="tabler:spy"
              class="min-w-4 min-h-4 mr-2 text-muted-foreground"
              aria-hidden="true"
            />
            {{ $t('components.navbar.privacy') }}
          </NuxtLinkLocale>
          <NuxtLinkLocale
            to="/policies/legal"
            class="flex items-center text-sm"
            test-id="footer-legal"
          >
            <Icon
              name="tabler:gavel"
              class="min-w-4 min-h-4 mr-2 text-muted-foreground"
              aria-hidden="true"
            />
            {{ $t('components.navbar.legal') }}
          </NuxtLinkLocale>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <UiSeparator class="bg-border" />
      <div class="flex flex-wrap justify-between gap-x-20 gap-y-2">
        <NuxtLink
          to="https://www.instagram.com/mount_lazarus/"
          target="_blank"
          class="text-muted-foreground text-sm"
          test-id="footer-illustration"
        >
          {{ $t('components.navbar.illustrations') }} Mount Lazarus
        </NuxtLink>
        <NuxtLinkLocale
          to="/updates/changelog"
          class="text-muted-foreground text-sm"
          test-id="footer-version"
        >
          V{{ $config.public.appVersion }}
        </NuxtLinkLocale>
        <p class="text-tertiary text-sm" test-id="footer-copyright">
          ©{{ new Date().getFullYear() }} dnd-tracker
        </p>
      </div>
    </div>
  </div>
</template>
