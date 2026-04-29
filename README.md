![CI](https://www.shieldcn.dev/github/ci/jeremyMees/dnd-tracker.svg?variant=secondary&size=sm)
![License](https://www.shieldcn.dev/github/license/jeremyMees/dnd-tracker.svg?variant=ghost&size=sm)
![Open issues](https://www.shieldcn.dev/github/open-issues/jeremyMees/dnd-tracker.svg?variant=secondary&size=sm)
![Open PRs](https://www.shieldcn.dev/github/open-prs/jeremyMees/dnd-tracker.svg?variant=secondary&size=sm)

# D&D Tracker

A modern web application designed to streamline your D&D encounter management experience. Say goodbye to the hassle of manual tracking and hello to smooth, efficient gameplay sessions.

## Features

- **Campaign Management**: Organize and track your D&D campaigns with ease
- **Encounter Management**: Streamline your combat encounters and keep track of initiative, HP, and status effects
- **Homebrew Management**: Create and manage custom content for your campaigns

## Tech Stack

- [Nuxt 4](https://nuxt.com/) - The Vue Framework
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [Tanstack Query](https://tanstack.com/query/latest) - Data fetching and caching

## Getting Started

### Prerequisites

- Node.js >= 22.0.0
- npm >= 10.0.0

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/dnd-tracker.git
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

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run generate` - Generate static site
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run typecheck` - Run TypeScript type checking

### Testing

#### Unit Tests
```bash
npm run test
```

#### End-to-End Tests
```bash
npm run e2e
```

## Contributing

We welcome contributions to D&D Tracker! Here's how you can help:

1. Fork the repository
2. Create a new branch for your feature (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run the test suite to ensure everything works:
   ```bash
   npm run test
   npm run e2e
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
