<script setup lang="ts">
import { Container, Heading, Text, Hr, Head, Preview, Html, Img, Section, Tailwind, Body } from '@vue-email/components'

defineProps<{
  email: string
  title: string
  preview: string
  heading?: string
  footer?: string
}>()
</script>

<template>
  <Tailwind
    :config="{
      theme: {
        extend: {
          colors: {
            bg: {
              DEFAULT: '#080808',
              light: '#1B1D1E',
            },
            primary: '#7333E0',
            secondary: '#D926AA',
            success: '#36D399',
            info: '#3ABFF8',
            warning: '#FBBD23',
            help: '#1FB2A5',
            danger: '#F87272',
          },
        },
      },
    }"
  >
    <Html>
      <Head>
        <title>
          {{ title }}
        </title>
      </Head>
      <Preview>
        {{ preview }}
      </Preview>
      <Body class="bg-bg my-auto mx-auto text-white">
        <Container class="border-4 border-solid border-slate-700 rounded-[8px] my-[40px] mx-auto p-[20px] max-w-[700px]">
          <Section class="mt-[32px]">
            <Img
              src="https://dnd-tracker.com/logo.png"
              width="250"
              alt="DnD Tracker"
              class="my-0 mx-auto"
            />
          </Section>
          <Heading
            v-if="heading"
            class="font-normal mt-[60px] mb-[30px] px-[20px]"
          >
            {{ heading }}
          </Heading>
          <Section class="px-[16px]">
            <slot />
          </Section>
          <Hr class="border border-solid border-slate-700 my-[26px] mx-0 w-full" />
          <Text class="text-[14px] leading-[24px] px-[16px]">
            Happy adventuring,
            <br>
            The DnD-Tracker Team
          </Text>
          <template v-if="footer">
            <Hr class="border border-solid border-slate-700 my-[26px] mx-0 w-full" />
            <Text class="text-[#666666] text-[12px] leading-[24px] px-[16px]">
              {{ footer }}
            </Text>
          </template>
        </Container>
      </Body>
    </Html>
  </Tailwind>
</template>
