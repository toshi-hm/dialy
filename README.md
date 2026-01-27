# Dialy

A diary app that lets you see past entries for the same day at a glance.

## Tech Stack

- **Next.js** v16.1.5 with TypeScript and React v19.2
- **Architecture**: Atomic Design pattern with App Router
- **Package Manager**: pnpm
- **Linter/Formatter**: Biome v2.3.13
- **CSS**: Tailwind v4.1
- **Validation**: Zod v4.3.6
- **Unit Testing**: Vitest v4.0.18
- **Component Development**: Storybook v10.2.0
- **Visual Regression Testing**: reg-suit v0.14.4
- **CI/CD**: GitHub Actions (Unit Test / VRT / Lint / Format)

## Project Structure

```
dialy/
├── .github/
│   └── workflows/         # CI/CD workflows
├── .storybook/            # Storybook configuration
├── public/                # Static assets
├── src/
│   ├── app/               # Next.js App Router pages
│   ├── components/        # React components (Atomic Design)
│   │   ├── atoms/         # Smallest components (Button, Input, etc.)
│   │   ├── molecules/     # Composed of atoms
│   │   ├── organisms/     # Complex components
│   │   └── templates/     # Page-level layouts
│   ├── lib/               # Utilities and configurations
│   │   └── validations/   # Zod schemas
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Helper functions
└── tests/                 # Test configuration
```

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- pnpm 9.x or higher

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

### Development

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
```

### Testing

```bash
pnpm test         # Run unit tests
pnpm test:ui      # Run tests with UI
pnpm test:coverage # Generate coverage report
```

### Code Quality

```bash
pnpm lint         # Run Biome linter
pnpm format       # Format code with Biome
pnpm format:check # Check code formatting
```

### Storybook

```bash
pnpm storybook       # Start Storybook dev server
pnpm build-storybook # Build Storybook for production
```

### Visual Regression Testing

```bash
npx reg-suit run  # Run visual regression tests
```

## CI/CD Pipeline

The project includes GitHub Actions workflows that run on all pull requests:

- **Lint & Format Check**: Validates code style using Biome
- **Unit Tests**: Runs all Vitest tests
- **Visual Regression Testing**: Compares Storybook screenshots

## Atomic Design Pattern

Components are organized following the Atomic Design methodology:

- **Atoms**: Basic building blocks (buttons, inputs, labels)
- **Molecules**: Simple combinations of atoms
- **Organisms**: Complex UI components
- **Templates**: Page-level layouts
- **Pages**: Specific instances of templates (in `src/app/`)

## Contributing

1. Create a feature branch from `main`
2. Make your changes following the established patterns
3. Ensure all tests pass and code is formatted
4. Submit a pull request

The CI pipeline will automatically validate your changes.

## License

Private project - All rights reserved.

