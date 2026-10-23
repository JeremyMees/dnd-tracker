# Testing

## Which project

- **`unit`** (`test/unit/**`, node, about 1 s for the whole project): pure
  utils, `shared/**`, and `server/api/**` route handlers called directly as
  functions. Auto-imports come from a hand-rolled unimport plugin in
  `test/unit/nuxt-env.ts`.
- **`nuxt`** (`test/nuxt/**`, happy-dom, boots the whole app per spec file):
  components, composables, queries, pages, middleware, plugins.

Put logic in a util so it can be tested in `unit`. A test that needs a real DOM
engine, such as sanitizer policy tests, goes in `unit` with
`// @vitest-environment jsdom`.

## Writing specs

- **Select DOM through `test-id="…"`** attributes, queried as
  `find('[test-id="title"]')`. If the element has none, add one to the template.
  Tags, classes and copy change during restyles.
- **Reuse the stubs.** Before writing a helper, check `test/nuxt/stubs/` and
  `test/unit/stubs/`. Helpers are split by concern (`form.ts`, `popover.ts`,
  `router.ts`, `tooltip.ts`, …). A new reusable helper goes in the matching
  concern file, not inline in a spec or in a generic helpers file. Shared mock
  data goes in `test/fixtures/<concern>.ts`.
- **Cleanup is global.** `test/nuxt/unit.setup.ts` runs
  `enableAutoUnmount(afterEach)`, so specs don't unmount by hand.
- **Mutations** get three tests: the real write with no callbacks, success with
  `mutationSpies()` (from `test/nuxt/stubs/query.ts`), and failure with the
  spies.
- **Prove a regression test.** Check it fails without the fix.

## Mocks and import order

- `vi.mock` only hoists above imports in the same file. When the mock lives in a
  stub file, import the stub before the module under test: vitest imports, then
  stubs, then the handler or component last.
- `test/nuxt/stubs/toast.ts` must be the first import in any spec that asserts
  toasts. Assert with
  `expect(toast.error).toHaveBeenCalledWith(title, { description })` or
  `expectNoToast()`.
- Route specs use `mockEvent` (`test/unit/stubs/api-event.ts`) and
  `mockAuthedUser` / `mockFrom` / `mockChain` (`test/unit/stubs/supabase.ts`).
  Pass `mockFrom` an array of chains when a route calls `.from()` on the same
  table more than once. For Stripe, spy on the real singleton with
  `vi.spyOn(stripe.<namespace>, '<method>')`.
- `export const { a } = vi.hoisted(…)` throws. Assign the hoisted object to a
  `const` first, then destructure it in a separate export.
- A promise returned by a `vi.fn` never counts as unhandled, so a
  floating-promise regression test must make the real dependency reject.

## Nuxt project harness

- **New app plugins** that call `useAuthentication` (or anything with side
  effects) need `vi.mock('~/plugins/<name>', () => ({ default: () => {} }))` in
  `test/nuxt/unit.setup.ts`, plus `vi.unmock` in the plugin's own spec.
  Otherwise unrelated query specs fail with "No 'queryClient' found". Run
  `test/nuxt/queries` after adding one.
- **One QueryClient per spec file.** Queries cache across tests in a file. Call
  `clearQueryCache()` in `beforeEach` (import it from `stubs/query-client`, not
  `stubs/query`, which mocks `$fetch` and breaks `registerEndpoint`). To see a
  loading state, gate the endpoint with a promise the test releases, then assert
  with `vi.waitFor`.
- **Setup and specs don't share module state.** @nuxt/test-utils resets modules
  between `unit.setup.ts` and the spec, so a spec that inspects a stub's state
  must register its own endpoint at the top of the spec.
- **Tooltips** need a provider that `mountSuspended` never renders. Mount any
  tree with a tooltip through `mountWithTooltips` (`mountWithForm` already
  does). Tooltips open on `pointermove`; use `hoverTooltip` / `dismissTooltip`.
- **Popovers** open with `openPopover` / `closePopover`, which skip the trigger.
  When you touch a trigger, add one test that clicks it.
- **`Lazy*` components** can't be stubbed by name. Use `mockComponent('Foo', …)`
  with the base name and assert inside `vi.waitFor`, or the lazy import resolves
  after teardown and logs an unhandled error.
- **Router.** The real router works for composables: use `goto`, `spyOnReplace`
  and `flushNavigation` from `stubs/router.ts`. Fake timers deadlock navigation,
  so call `vi.useRealTimers()` in `beforeEach`. In component specs
  `mountSuspended` resets the route, so mock `useRoute` with a getter over a ref
  instead.
- **Links** use i18n route names; the `NuxtLinkLocale` stub resolves them
  through `localeHref()`, so assert real URLs.
- **Composables tested outside a component** leak vueuse listeners (no effect
  scope). Mock the hook with `mockNuxtImport` and call the captured handler
  rather than dispatching real DOM events. A `useState` mock must cache by key
  if two instances need to share state.
- **c15t consent** runs in offline mode with no banner. Specs that open the
  preferences dialog click under `vi.useFakeTimers()`, or a 3 s timer fires
  after teardown and flakes another spec.

## Library quirks

- **vee-validate.** A value change queues a debounced validation, so call
  `settle()` (`stubs/form.ts`) before validating or submitting by hand
  (`submitForm()` already does). Schema errors land on the nearest registered
  field path. Field paths inside repeater items must be getters.
- **DOMPurify is wrong under happy-dom.** It strips allowed tags and keeps
  `onclick`. Test sanitizer policy in `unit` with jsdom; in `nuxt` specs, stub
  the sanitizer and test the wiring.
- **TipTap** updates its reactive state over two animation frames. With fake
  timers, `await vi.advanceTimersByTimeAsync(32)` before asserting the toolbar
  DOM.
- **`<Transition>`** never finishes leaving in happy-dom, so assert on something
  that updates synchronously (an `aria-label`) instead of `display: none`.
- **Collapsed toggles:** check hidden content with `isHidden()` from
  `stubs/form.ts`; `isVisible()` doesn't work on unattached elements.

## Coverage

The threshold is 80% for lines, functions, branches and statements.
`app/components/ui/**` (shadcn), `app/components/animation/**` and
`app/emails/**/*.vue` are excluded on purpose. Before writing tests to raise a
number, rule out these artifacts:

- The text reporter hides files at 100%. Check `coverage-summary.json` rather
  than reading a missing row as a missing file.
- A `v-if` or ternary that calls an auto-imported function leaves one branch at
  0 hits under every test. That's instrumentation, not a gap.
- An empty `statementMap` in `coverage-final.json` means a broken sourcemap in
  the transform chain, not missing tests.

## Tooling

- `npx vitest run --project nuxt -u <file>` runs the whole nuxt project, about
  250 files. Check `git status` for the `.snap` files you meant to update.
- If nuxt specs fail on a second run with "Failed to resolve
  ./diagnostics/core.js", or a server spec picks up an old auto-import path, run
  `npx vitest run --clearCache`. `skipStubEntryFsCache()` in
  `test/nuxt/nuxt-env.ts` works around the first case; remove it once
  @nuxt/test-utils keeps its stub out of the cache.
- When testing a dependency bump, run at least two nuxt specs twice: `npm ci`
  wipes the cache, so the first run always passes.
- Running whole directories of specs at once has been killed with exit 137. Run
  the touched files.
