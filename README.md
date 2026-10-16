![CI](https://www.shieldcn.dev/github/ci/jeremyMees/dnd-tracker.svg?variant=secondary&size=sm)
![License](https://www.shieldcn.dev/github/license/jeremyMees/dnd-tracker.svg?variant=ghost&size=sm)
![Open issues](https://www.shieldcn.dev/github/open-issues/jeremyMees/dnd-tracker.svg?variant=secondary&size=sm)
![Open PRs](https://www.shieldcn.dev/github/open-prs/jeremyMees/dnd-tracker.svg?variant=secondary&size=sm)

# D&D Tracker

A modern web application designed to streamline your D&D encounter management
experience. Say goodbye to the hassle of manual tracking and hello to smooth,
efficient gameplay sessions.

## Features

- **Initiative tracker**: Track initiative, HP, AC, conditions, concentration
  and death saves, with a combat log and an end-of-combat summary
- **Timed conditions**: Give conditions a duration or a save that ends them,
  fill it in from a spell and get reminders at the start of each turn
- **Player portal (Pro)**: Players join with a code, follow the fight live and
  update their own character
- **Campaigns**: Invite your group, share notes and manage roles
- **Homebrew**: Create creatures from scratch or remix a bestiary monster
- **D&D content**: Browse SRD spells, monsters, conditions, magic items, weapons
  and armor
- **Tools**: Dice roller, fantasy name generator and pinned info cards
- **Languages**: English and Dutch

## Tech Stack

- [Nuxt 4](https://nuxt.com/) - The Vue framework
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn-vue](https://www.shadcn-vue.com/) - UI components on reka-ui
- [Supabase](https://supabase.com/) - Database, auth and realtime
- [TanStack Query](https://tanstack.com/query/latest) - Data fetching and
  caching
- [Open5e](https://open5e.com/) - Source of the SRD content
- [Stripe](https://stripe.com/) - Pro subscriptions
- [Sentry](https://sentry.io/) - Error tracking
- [Vitest](https://vitest.dev/) - Unit and component tests

## Getting Started

### Prerequisites

- Node.js >= 24.0.0
- npm >= 10.0.0 (pnpm and yarn are not supported)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/jeremyMees/dnd-tracker.git
cd dnd-tracker
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Development Commands

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run generate` - Generate a static site
- `npm run preview` - Preview the production build
- `npm run lint` / `npm run lint:fix` - Run ESLint, or fix what it can
- `npm run format` / `npm run format:fix` - Check or fix formatting with
  Prettier
- `npm run typecheck` - Run TypeScript type checking
- `npm run sb:types` - Generate the Supabase database types
- `npm run sb:schema` - Dump the database schema to `supabase/schema.sql` (needs
  Docker)
- `npm run open5e:sync` - Sync the SRD content from Open5e into the database
  (add `--dry-run` or `--only=spells` to narrow it down)
- `npm run stripe` - Forward Stripe webhooks to the local server
- `npm run deps` - Update dependencies with taze

### Testing

```bash
npm run test
```

Run `npm run test:coverage` for a coverage report.

## Contributing

We welcome contributions to D&D Tracker! Here's how you can help:

1. Fork the repository
2. Create a new branch for your feature
   (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run the test suite to ensure everything works:
   ```bash
   npm run test
   ```
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Pull Request Requirements

- All code changes must be made via Pull Requests
- PRs must be approved by a code owner
- All automated workflows must pass:
  - Linting checks
  - Unit tests
- Code should follow the existing style and patterns
- Include tests for new features
- Update documentation as needed
