<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    preview: string
    heading?: string
    footer?: boolean
  }>(),
  {
    heading: '',
    footer: true,
  },
)
</script>

<template>
  <Html>
    <Head>
      <title>{{ title }}</title>
      <meta name="color-scheme" content="light dark" />
      <meta name="supported-color-schemes" content="light dark" />
      <style>
        @import '@maizzle/tailwindcss';

        @theme {
          --color-primary: #7231e3;
        }

        :root {
          color-scheme: light dark;
          supported-color-schemes: light dark;
        }

        @utility bg-background {
          background-color: #ffffff;
          @media (prefers-color-scheme: dark) {
            background-color: #09090b !important;
          }
        }

        @utility bg-card {
          background-color: #ffffff;
          @media (prefers-color-scheme: dark) {
            background-color: #09090b !important;
          }
        }

        @utility text-foreground {
          color: #09090b;
          @media (prefers-color-scheme: dark) {
            color: #fafafa !important;
          }
        }

        @utility text-card-foreground {
          color: #09090b;
          @media (prefers-color-scheme: dark) {
            color: #fafafa !important;
          }
        }

        @utility border-border {
          border-color: #e4e4e7;
          @media (prefers-color-scheme: dark) {
            border-color: #27272a !important;
          }
        }

        @utility bg-border {
          background-color: #e4e4e7;
          @media (prefers-color-scheme: dark) {
            background-color: #27272a !important;
          }
        }
      </style>
    </Head>
    <Body class="m-auto bg-background font-sans text-foreground">
      <Preheader>{{ preview }}</Preheader>
      <Container class="my-10 max-w-[700px]">
        <Section
          class="rounded-lg border border-border bg-card p-5 text-card-foreground"
        >
          <Section class="mt-8 text-center">
            <Img src="/logo.png" alt="DnD Tracker" width="250" />
          </Section>
          <Heading
            v-if="heading"
            class="mt-15 mb-7.5 text-[32px]/10 font-normal"
          >
            {{ heading }}
          </Heading>
          <Section>
            <slot />
          </Section>
          <EmailFooter v-if="footer" />
        </Section>
      </Container>
    </Body>
  </Html>
</template>
