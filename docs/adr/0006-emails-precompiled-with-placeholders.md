# Emails are precompiled HTML filled in at send time

Email templates are Maizzle Vue files in `app/emails/`. `nuxt build` compiles
them to HTML and text in `server/assets/emails/`, and `renderEmail()` fills
`{{ key }}` (escaped), `{{{ key }}}` (raw, pre-sanitized HTML) and
`{{#key}}…{{/key}}` (section dropped when empty) at send time. Maizzle's own
`render()` starts a Vite server for each call and needs the `.vue` sources,
which doesn't work in a Vercel function.

## Consequences

- All Maizzle config lives under `maizzle` in `nuxt.config.ts`, with no
  `maizzle.config.ts`.
- Styling uses the app's token classes. Email clients strip `var()`, so the
  layout defines each token with the light value inlined and a
  `prefers-color-scheme: dark` override.
- Template coverage numbers are a sourcemap artifact and are excluded from
  coverage.
