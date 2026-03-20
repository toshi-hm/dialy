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
pnpm test:vrt     # Run visual regression tests
```

## CI/CD Pipeline

The project includes GitHub Actions workflows that run on all pull requests:

- **Lint & Format Check**: Validates code style using Biome
- **Unit Tests**: Runs all Vitest tests
- **Visual Regression Testing**: Compares Storybook screenshots

## Security

### Data Storage

Dialy uses **LocalStorage** for data persistence in the MVP version. Please be aware of the following:

- **Data is stored locally**: All diary entries are stored in your browser's LocalStorage
- **No server-side backup**: Data is not backed up to a server
- **Browser-specific**: Data is tied to your browser and cannot be synced across devices
- **Clear cache warning**: Clearing browser data will delete all diary entries permanently
- **Privacy**: Your data never leaves your device in the MVP version

### Security Headers

The application implements the following security measures:

- **HSTS**: HTTP Strict Transport Security to enforce HTTPS connections
- **X-Frame-Options**: Prevents clickjacking attacks by disallowing iframe embedding
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-XSS-Protection**: Enables browser XSS filter
- **CSP**: Content Security Policy to prevent XSS and data injection attacks
- **Referrer-Policy**: Controls referrer information sent with requests

### Environment Variables

This project does not currently use environment variables in the MVP version. When environment variables are introduced in future versions:

1. Create a `.env.local` file (already in `.gitignore`)
2. Never commit `.env.local` or any file containing secrets to git
3. Document all required environment variables (names, purpose, and example values) in this README and/or dedicated documentation under `docs/`

## Atomic Design Pattern

Components are organized following the Atomic Design methodology:

- **Atoms**: Basic building blocks (buttons, inputs, labels)
- **Molecules**: Simple combinations of atoms
- **Organisms**: Complex UI components
- **Templates**: Page-level layouts
- **Pages**: Specific instances of templates (in `src/app/`)

See [docs/COMPONENT_DESIGN_GUIDE.md](./docs/COMPONENT_DESIGN_GUIDE.md) for detailed component design guidelines.

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[00_INDEX.md](./docs/00_INDEX.md)**: Documentation index
- **[01_REQUIREMENTS.md](./docs/01_REQUIREMENTS.md)**: Functional and non-functional requirements
- **[02_ARCHITECTURE.md](./docs/02_ARCHITECTURE.md)**: System architecture and design patterns
- **[03_DATA_MODEL.md](./docs/03_DATA_MODEL.md)**: Data models and schemas
- **[04_UI_UX_DESIGN.md](./docs/04_UI_UX_DESIGN.md)**: UI/UX design specifications
- **[05_FEATURES.md](./docs/05_FEATURES.md)**: Feature specifications
- **[06_SECURITY.md](./docs/06_SECURITY.md)**: Security design and checklist
- **[07_PERFORMANCE.md](./docs/07_PERFORMANCE.md)**: Performance optimization strategies
- **[DOMAIN_GLOSSARY.md](./docs/DOMAIN_GLOSSARY.md)**: Ubiquitous language dictionary
- **[COMPONENT_DESIGN_GUIDE.md](./docs/COMPONENT_DESIGN_GUIDE.md)**: Component design guidelines
- **[SPEC_SYNC_RULES.md](./docs/SPEC_SYNC_RULES.md)**: Rules for keeping specs and code in sync

## Contributing

1. Create a feature branch from `main`
2. Make your changes following the established patterns
3. Ensure all tests pass and code is formatted
4. Submit a pull request

The CI pipeline will automatically validate your changes.

## License

Private project - All rights reserved.
