# Code conventions

House rules a reviewer will ask for. Each one came from a real review comment.

## Where code goes

- **Logic in utils, wiring in components.** Anything another component or the
  server could reuse goes in `shared/utils/` (D&D and row rules used by both
  sides, `shared/utils/dnd/*`) or `app/utils/` (client-only), with its own unit
  test. Components keep UI state and wiring. When logic moves out of a route or
  component, its exported functions get direct tests in the util's spec, not
  only coverage through the old caller.
- **The `shared/utils` barrel.** Nuxt only auto-imports the top level of
  `shared/utils/`. A new file in a subfolder (`dnd/`, `transformers/`) needs an
  `export * from './<dir>/<file>'` line in `shared/utils/index.ts`, or it is
  undefined at runtime in the app and in Nitro. The unit test project scans
  subfolders, so a green unit suite does not prove the barrel is right. Check
  with `grep <name> .nuxt/imports.d.ts .nuxt/types/nitro-imports.d.ts`.
- **Types in types folders.** Exported types go in `app/types/` (client only),
  `server/types/` (server only) or `shared/types/` (used by both, or a
  request/response payload). All three are auto-imported, so use types bare and
  never import them by path. Utils, composables, queries, routes and constants
  export only values. For a type that mirrors a constant, write the literal
  union in the types file and give the constant
  `as const satisfies readonly T[]` (see `homebrewType`).
- **Components only when generic.** Extract a child component when a second
  feature would use it, such as a step header or tab nav. Feature-specific
  markup stays in the parent's template, even when it is a self-contained block.
- **One `useForm()` per component.** vee-validate's form context is provided per
  component instance, so a second `useForm()` in the same `setup()` silently
  takes over every field. Give each form its own SFC (see `HpUpdate.vue`,
  `AcUpdate.vue`).

## Writing code

- **Comment-free.** Source and tests carry no comments. Say it with a name, or
  explain it in the PR or chat.
- **Sets for lookups.** A list only used for membership checks is a `Set` with
  `.has`.
- **Floating promises.** Use `void` for a promise that can't reject
  (`invalidateQueries`, `removeChannel`), `.catch(() => undefined)` for one that
  can (`mutateAsync`, `router.replace`), and `await` for `navigateTo`.
  `removeChannel` already unsubscribes.
- **Deliberate oddities.** `shared/utils/dnd/undo.ts` copies with a JSON round
  trip because `structuredClone` throws on reactive sheets.
  `scripts/sync-open5e.ts` upserts chunks one after another so it stops at the
  first failed range.
- **Narrow parameter types.** When a helper declares a wider type than it reads,
  narrow it with `Pick<…>`. Don't widen a `select()` to satisfy a signature;
  server routes select only the columns they use (see `requireEncounterAccess`).
- **Fix hydration mismatches at the source.** Make server and client render the
  same first output (shared query cache, no `window`, random or time values on
  first render). `<ClientOnly>` hides the bug and is not used for this.
- **Idiomatic framework code.** When a linter, type checker or build tool flags
  documented framework usage, the tool is wrong: report it upstream rather than
  bending the source. Ask before adding a dependency, even when an error message
  suggests one.
- **Row changes go through a patch** where one exists (`patchRow`, `patchRows`),
  rather than writing the whole `rows` array. See ADR-0002.
- **Sheet writes go through `server/utils/sheet-changes.ts`.** Row patches
  (`applyRowPatches`), turn advance (`advanceSheetTurn`) and whole-sheet edits
  (`applySheetUpdate`) read the sheet before the change, enforce the row rules
  (rows exist, a claimed row can't be hidden), log the combat events and send
  the broadcasts per topic. A route only checks auth, parses the body and calls
  one of them; the browser never writes the rows, turn, settings or info of a
  sheet directly. Supabase and Realtime sit behind the `SheetStore` and
  `SheetBroadcaster` adapters in `server/utils/sheet-adapters.ts`.
- **HP and AC changes go through `applyHpChange` / `applyAcChange`**
  (`shared/utils/dnd/hp-ac.ts`). Pass the row, the change and the context (the
  negative HP setting, and the Bloodied condition when the sheet has it on); get
  back the combat patch and the messages to show. Damage defenses, criticals,
  death saves and Bloodied happen inside, so don't rebuild them at a call site.
- **Icons are tabler via `@nuxt/icon`:**
  `<Icon name="tabler:…" aria-hidden="true" />`. `components.json` still says
  lucide, so after any `shadcn-vue add`, replace the lucide imports, uninstall
  the lucide package it added, and check the name exists in
  `node_modules/@iconify-json/tabler/icons.json`.
- **Toasts** use `toast` from `vue-sonner`. Shared code returns `ToastItem`
  descriptors, which components show with `useToastItems()`.
- **Optional form fields hide behind a toggle.** Show the quick path first and
  put custom or advanced inputs in a collapsed section, following
  `HomebrewInformation.vue`: a full-width secondary button with a rotating
  `tabler:chevron-down`, `:aria-expanded`, and the content in
  `<AnimationExpand>` with `v-show` so the fields stay mounted.
- **reka-ui triggers each own an element.** Nesting one trigger in another
  through `as-child` (a tooltip around a popover trigger) passes in happy-dom
  but breaks in the browser. Put the tooltip on the button's inner content
  instead.
- **i18n.** Every string goes in both `i18n/locales/en.json` and `nl.json`.
  Reuse `general.*` and `actions.*` keys (pluralised with a count, such as
  `$t('general.condition', 2)`) before adding feature keys. Links use route
  names (`typedPages` is on), never path strings.

## Composables and queries

- **VueUse `useStorage` is not auto-imported**, because the name collides with
  Nitro's. Use `useLocalStorage` / `useSessionStorage`. With a `null` default,
  pass `serializer: StorageSerializers.object`, or objects are stored as
  `"[object Object]"`.
- **Shared composables clean up with `onScopeDispose`.** Under
  `createSharedComposable`, an `onBeforeUnmount` binds to the first caller and
  tears the shared state down while other callers still use it.
- **Query caching.** Supabase-backed queries use the plugin defaults in
  `app/plugins/vue-query.ts`. SRD queries without filters use `ONE_DAY`;
  filtered or paginated listings use `TEN_MINUTES`, because each filter
  combination is its own cache entry. Move `staleTime` and `gcTime` together,
  and use `placeholderData` rather than `initialData` for a stand-in value.
- **Mutation error toasts** live inside the mutation itself. A shared
  failure-toast composable was proposed and rejected.
