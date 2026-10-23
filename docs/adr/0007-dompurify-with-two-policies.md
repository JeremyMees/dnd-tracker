# The browser sanitizes with lazy-loaded DOMPurify and two policies

`app/utils/sanitize-html.ts` lazy-loads DOMPurify. The notes editor uses the
allow-list in `constants/html-policy.ts`, and SRD markdown uses DOMPurify's
defaults, because the notes allow-list strips tables. Using one `sanitize-html`
library for browser and server was measured and rejected: 63.6K gzip in the
browser against DOMPurify's 11.1K. The two engines share the policy constants
instead.
