# The Supabase client stays in the entry bundle

The Supabase client costs 55.4K gzip of the entry chunk (measured 2026-09-08).
Lazy-loading it would mean replacing `@nuxtjs/supabase`'s client plugin and
making about 43 `useSupabaseClient()` call sites async. The work was costed and
declined. Reopen this only with a new measurement that shows real user impact.
