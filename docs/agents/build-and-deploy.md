# Build and deploy

## The build must exit

`nuxt build` never calls `process.exit()`, and Nitro's prerender runs the app
inside the build process. Any timer still holding the event loop open after
prerendering keeps the Vercel build running forever, with "Build complete!" as
the last log line. Two defences are in place:

- `app/plugins/vue-query.ts` gives TanStack Query a server-side timeout provider
  that `unref()`s every timer. Clearing the query cache after render is not
  enough, because queries that settle later schedule new timers.
- The `hooks.close` guard in `nuxt.config.ts` force-exits real builds. It skips
  dev, test (the `nuxt` vitest project builds a real Nuxt, and exiting would
  lose coverage), `nuxt prepare` (the `postinstall`) and `nuxt analyze`.

Anything that starts a timer or a connection pool at module scope during
prerender needs the same care: create it lazily, or unref its timers.

To find a hanging timer, run
`NITRO_PRESET=vercel node --import <probe> ./node_modules/nuxt/bin/nuxt.mjs build`
with a probe that wraps `setTimeout` / `setInterval`, records each one's stack,
and prints the timers still holding the process open.

## Local builds and Sentry

`.env.sentry-build-plugin` is loaded straight into `process.env`, so every local
`nuxt build` or `nuxt analyze` uploads sourcemaps and creates a Sentry release.
No env var turns that off. Move the file aside before building locally.

## Measuring bundle size

Run `npx nuxt analyze`. The treemaps land in `.nuxt/analyze/*.html`, and the
build writes readable chunk names to `.output/public/_nuxt`. Rank by bytes
attributed from the `.map` files, not by treemap area or source size: shared
chunks get named after one arbitrary module. When checking whether code ships,
grep the `.js` / `.mjs` files only; `.map` files contain pre-tree-shaking
source.

## Dependency pins

These look like dead config but are load-bearing:

- **`overrides.nitro.vite`** in `package.json`: `@sentry/nuxt` has an optional
  peer on `nitro` 3, and `nitro@3.0.0` is a placeholder that peers on vite 7.
  Without the override any Sentry update fails with ERESOLVE. Drop it once a
  stable nitro 3 accepts vite 8 or Sentry drops the peer (issue #289). Don't
  reach for `--legacy-peer-deps`.
- **Stripe API version.** The SDK's `apiVersion` in `server/utils/stripe.ts`,
  the installed SDK's types and the Stripe account default (which the live
  webhook endpoint follows) must all be on the same version. A mismatch still
  compiles, while webhook payloads stop matching their types. When bumping the
  `stripe` package, change `apiVersion` in the same commit and upgrade the
  account default in Workbench right after the deploy.
- **VueUse stays on 14** until reka-ui accepts 15; otherwise two copies ship to
  the browser. When upgrading, keep `useThrottleFn`'s current behaviour in
  `app/pages/profile.vue` explicit (15 defaults `trailing: true`).
- **TypeScript stays on 5.x for now.** 7 is blocked: typescript-eslint requires
  < 6.1, and TS 7 exposes no compiler API for vue-tsc. 6.0 is a possible
  intermediate step.

## Supabase module config

`@nuxtjs/supabase` adds `ssr: false` to whatever route
`redirectOptions.callback` names. It is set to `/confirm`, which has no page.
Pointing it at a real page turns that page into a client-only shell. When a page
unexpectedly renders as an SPA shell, read the compiled `routeRules` in
`.output/server/chunks/nitro/nitro.mjs`; modules merge rules there that aren't
in `nuxt.config.ts`.

## Public endpoints

Every unauthenticated route calls
`assertRateLimit(event, { key, limit, windowMs })` from
`server/utils/rate-limit.ts` first, with a distinct `key` per route. Counts live
in Nitro's default storage, so they are per instance on Vercel.

## Emails

New email: `app/emails/<Name>.vue`, an entry in `EmailValues`, and a stub
template in `test/unit/stubs/email.ts`. In `nuxt.config.ts`'s `maizzle` config:

- `static.source` is `[]`, so Maizzle doesn't copy all of `public/` into the
  bundle.
- `url.base` applies only to `img` tags, so `href="{{ link }}"` placeholders
  stay untouched.
- `css.base` is `app/emails`, so Tailwind doesn't scan the whole app.

In templates, put placeholders in body text inside `v-pre` elements, and write
section markers as `<Raw content="{{#name}}" />` (the slot form breaks the type
checker and Prettier). In development `renderEmail` fetches from Maizzle's dev
server on `localhost:4321`, which is also where emails are previewed.

## SRD sync

`npm run open5e:sync` refreshes the `srd_*` tables from Open5e (also run by the
`sync-open5e` workflow). Use `-- --dry-run` to check a change to the sync
without writing.

## Local URLs

QR codes and share links are built from `NUXT_PUBLIC_SITE_URL`. To get
`localhost` links while testing the Player Portal, override it in `.env.local`.

## CI

`validate.yaml` runs linting, formatting, typechecking and tests, called by both
the pull-request and deploy workflows. Tests run as sharded jobs over the whole
suite, because a unit-only job would spend about 30 s on setup to run 1 s of
tests. Only the lint job saves the `node_modules` cache, so every job misses the
cache on the first run after a lockfile change; that's expected.
