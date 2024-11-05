<script setup lang="ts">
const localePath = useLocalePath()
</script>

<template>
  <div class="bg-tracker/60 border-4 border-tracker m-4 rounded-lg pt-10 pb-2">
    <div class="container-max px-4 flex flex-col gap-20">
      <div class="grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-y-10 gap-x-20">
        <NuxtLink
          :to="localePath('/')"
          class="mt-2"
        >
          <NuxtImg
            src="/icon-logo.svg"
            alt="DnD Tracker logo"
            width="120"
            height="100"
          />
        </NuxtLink>
        <div class="mt-4 lg:mt-0">
          <p class="mb-4 head-3">
            Contact
          </p>
          <div class="flex flex-col gap-4">
            <NuxtLink
              to="mailto:jeremy@dnd-tracker.com"
              class="flex"
            >
              <Icon
                name="material-symbols:mail-outline-rounded"
                class="min-w-6 min-h-6 mr-2"
                aria-hidden="true"
              />
              <span>
                Email
              </span>
            </NuxtLink>
            <NuxtLink
              :to="localePath('/contact')"
              class="flex"
            >
              <Icon
                name="fluent:form-24-regular"
                class="min-w-6 min-h-6 mr-2"
                aria-hidden="true"
              />
              <span>
                Form
              </span>
            </NuxtLink>
          </div>
        </div>
        <div>
          <p class="mb-4 head-3">
            Socials
          </p>
          <div class="flex flex-col gap-4">
            <NuxtLink
              to="https://www.instagram.com/dnd.tracker/"
              target="_blank"
              class="flex"
            >
              <Icon
                name="mdi:instagram"
                class="min-w-6 min-h-6 mr-2"
                aria-hidden="true"
              />
              <span>
                Instagram
              </span>
            </NuxtLink>
            <NuxtLink
              to="https://discord.gg/NxghtztVX7"
              target="_blank"
              class="flex"
            >
              <Icon
                name="mingcute:discord-line"
                class="min-w-6 min-h-6 mr-2"
                aria-hidden="true"
              />
              <span>
                Discord
              </span>
            </NuxtLink>
            <NuxtLink
              to="https://ko-fi.com/jeremymees"
              target="_blank"
              class="flex"
            >
              <Icon
                name="simple-icons:kofi"
                class="min-w-6 min-h-6 mr-2"
                aria-hidden="true"
              />
              <span>
                Kofi
              </span>
            </NuxtLink>
          </div>
        </div>
        <div>
          <p class="mb-4 head-3">
            Updates
          </p>
          <div class="flex flex-col gap-4">
            <NuxtLink
              :to="localePath('/updates/feature-request')"
              class="flex"
            >
              <Icon
                name="ph:git-pull-request"
                class="min-w-6 min-h-6 mr-2"
                aria-hidden="true"
              />
              <span>
                Feature requests
              </span>
            </NuxtLink>
            <NuxtLink
              :to="localePath('/updates/changelog')"
              class="flex"
            >
              <Icon
                name="ph:lightning"
                class="min-w-6 min-h-6 mr-2"
                aria-hidden="true"
              />
              <span>
                Changelogs
              </span>
            </NuxtLink>
          </div>
        </div>
        <div>
          <p class="mb-4 head-3">
            Policies
          </p>
          <div class="flex flex-col gap-4">
            <NuxtLink
              :to="localePath('/policies/cookie')"
              class="flex"
            >
              <Icon
                name="material-symbols:cookie-outline-rounded"
                class="min-w-6 min-h-6 mr-2"
                aria-hidden="true"
              />
              <span>
                Cookie
              </span>
            </NuxtLink>
            <NuxtLink
              :to="localePath('/policies/privacy')"
              class="flex"
            >
              <Icon
                name="ic:outline-shield"
                class="min-w-6 min-h-6 mr-2"
                aria-hidden="true"
              />
              <span>
                Privacy
              </span>
            </NuxtLink>
            <NuxtLink
              :to="localePath('/policies/legal')"
              class="flex"
            >
              <Icon
                name="mdi:legal"
                class="min-w-6 min-h-6 mr-2"
                aria-hidden="true"
              />
              <span>
                Legal
              </span>
            </NuxtLink>
          </div>
        </div>
      </div>
      <div class="flex flex-wrap justify-between gap-x-20 gap-y-4">
        <NuxtLink
          to="https://www.instagram.com/mount_lazarus/"
          target="_blank"
          class="text-slate-300 body-small"
        >
          Illustrations by Mount Lazarus
        </NuxtLink>
        <p class="text-secondary body-small">
          ©{{ new Date().getFullYear() }} dnd-tracker
        </p>
      </div>
    </div>
  </div>
</template>
