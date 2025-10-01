# BiblioGame Zone

<div align="center">
  <h1>📚 BiblioGame Zone</h1>
  <p><strong>A gamified reading management platform built with modern React, TypeScript, and Supabase</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/React-18.x-blue?logo=react" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-5.x-purple?logo=vite" alt="Vite" />
    <img src="https://img.shields.io/badge/Supabase-green?logo=supabase" alt="Supabase" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-3.x-teal?logo=tailwindcss" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/WCAG_2.1_AA-Compliant-green" alt="WCAG 2.1 AA" />
  </p>
</div>

## 🌟 Overview

BiblioGame Zone is a comprehensive reading management platform that gamifies the
reading experience through achievements, progress tracking, and social features.
Built with enterprise-level architecture, performance optimization, and full
accessibility compliance.

### ✨ Key Features

- **📖 Reading Management** - Track books, reading sessions, and progress
- **🏆 Achievement System** - Unlock badges and earn points for reading
  milestones
- **👥 Social Features** - Connect with other readers and share progress
- **📊 Analytics Dashboard** - Comprehensive reading statistics and insights
- **♿ Accessibility First** - WCAG 2.1 AA compliant with comprehensive screen
  reader support
- **⚡ Performance Optimized** - Lazy loading, virtualization, and intelligent
  caching
- **🧪 Thoroughly Tested** - >80% test coverage with comprehensive testing
  infrastructure

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** or **bun** package manager
- **Supabase** account for backend services

### Installation

```bash
# Clone the repository
git clone https://github.com/jg-365/bibliogame-zone.git
cd bibliogame-zone

# Install dependencies
npm install
# or
bun install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
# or
bun dev
```

The application will be available at `http://localhost:5173`

## 📁 Project Structure

```
bibliogame-zone/
├── public/                     # Static assets
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # Base UI components (shadcn/ui)
│   │   └── auth/             # Authentication components
│   ├── hooks/                # Custom React hooks
│   │   ├── useAuth.tsx       # Authentication hook
│   │   ├── useBooks.tsx      # Books management hook
│   │   └── useProfile.tsx    # User profile hook
│   ├── pages/                # Page components
│   │   ├── Dashboard.tsx     # Main dashboard
│   │   ├── Social.tsx        # Social features
│   │   ├── Profile.tsx       # User profile
│   │   └── Index.tsx         # Landing page
│   ├── shared/               # Shared utilities and components
│   │   ├── components/       # Shared components
│   │   ├── utils/           # Utility functions
│   │   ├── accessibility/   # WCAG compliance tools
│   │   └── performance/     # Performance optimization
│   ├── types/               # TypeScript type definitions
│   ├── integrations/        # External service integrations
│   │   └── supabase/       # Supabase client and types
│   ├── data/               # Mock data and constants
│   └── __tests__/          # Test files and utilities
├── supabase/               # Supabase configuration
├── docs/                   # Documentation files
└── [config files]         # ESLint, Prettier, Jest, etc.
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build
npm run type-check      # Run TypeScript type checking

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run format          # Format code with Prettier
npm run format:check    # Check code formatting

# Testing
npm run test            # Run tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report
npm run test:ui         # Run tests with UI

# Database
npm run db:types        # Generate Supabase types
npm run db:reset        # Reset database
npm run db:seed         # Seed database with sample data
```

### Code Quality Tools

- **ESLint** - Code linting with accessibility, React, and TypeScript rules
- **Prettier** - Code formatting with consistent style
- **TypeScript** - Strict type checking and modern JavaScript features
- **Jest + Testing Library** - Comprehensive testing with >80% coverage target
- **Husky** - Git hooks for code quality enforcement

### Architecture Principles

1. **Modular Architecture** - Feature-based organization with clear separation
   of concerns
2. **Type Safety** - Comprehensive TypeScript implementation with strict
   configuration
3. **Performance First** - Lazy loading, memoization, and intelligent caching
4. **Accessibility First** - WCAG 2.1 AA compliance with comprehensive testing
5. **Testing Culture** - Test-driven development with high coverage standards

## 🎨 UI/UX Design System

### Component Library

Built on **shadcn/ui** with custom extensions:

- **Accessible Components** - All components follow WCAG 2.1 AA guidelines
- **Consistent Theming** - CSS variables for easy customization
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Dark Mode Support** - System preference detection and manual toggle

### Design Tokens

```css
/* Color Palette */
--primary: 262.1 83.3% 57.8%; /* Purple */
--secondary: 220 14.3% 95.9%; /* Light Gray */
--accent: 142.1 76.2% 36.3%; /* Green */
--destructive: 0 84.2% 60.2%; /* Red */

/* Typography */
--font-sans: "Inter", system-ui, sans-serif;
--font-mono: "JetBrains Mono", monospace;
```

## 🧪 Testing Strategy

### Testing Philosophy

- **Test-Driven Development** - Write tests before implementation
- **High Coverage Standards** - Target >80% coverage across all metrics
- **Accessibility Testing** - Automated and manual accessibility validation
- **Performance Testing** - Bundle size and runtime performance monitoring

### Testing Stack

- **Jest** - Test runner and assertion library
- **Testing Library** - Component and hook testing utilities
- **MSW** - API mocking for integration tests
- **axe-core** - Automated accessibility testing

### Test Structure

```
src/__tests__/
├── utils/               # Test utilities and helpers
│   ├── testUtils.tsx   # Custom render functions
│   ├── mockData.ts     # Mock data generators
│   └── setupTests.ts   # Global test configuration
├── components/         # Component unit tests
├── hooks/              # Hook integration tests
├── pages/              # Page integration tests
└── e2e/               # End-to-end tests
```

## ♿ Accessibility

### WCAG 2.1 AA Compliance

- **Perceivable** - Alt text, color contrast, scalable text
- **Operable** - Keyboard navigation, focus management, no seizure triggers
- **Understandable** - Clear language, predictable navigation, input assistance
- **Robust** - Valid HTML, ARIA implementation, cross-browser compatibility

### Accessibility Features

- **Screen Reader Support** - Comprehensive ARIA implementation
- **Keyboard Navigation** - Full keyboard accessibility
- **Focus Management** - Logical focus order and visible indicators
- **High Contrast Mode** - Support for high contrast preferences
- **Reduced Motion** - Respects user motion preferences
- **Skip Links** - Quick navigation for screen reader users

### Testing Tools

- **Real-time Validation** - Development-time accessibility checking
- **Automated Testing** - Integration with jest-axe for CI/CD
- **Manual Testing Guidelines** - Comprehensive testing procedures

## ⚡ Performance

### Optimization Strategies

- **Code Splitting** - Route-based and component-based splitting
- **Lazy Loading** - Dynamic imports for non-critical components
- **Memoization** - React.memo and useMemo for expensive operations
- **Virtualization** - Efficient rendering of large lists
- **Caching** - Intelligent query caching with React Query
- **Bundle Analysis** - Continuous monitoring of bundle size

### Performance Metrics

- **Core Web Vitals** - LCP, FID, CLS monitoring
- **Bundle Size** - Target <500KB initial bundle
- **Load Time** - <3s first contentful paint
- **Accessibility** - 100% Lighthouse accessibility score

### Monitoring

- **Development Tools** - Real-time performance debugging
- **Production Monitoring** - Web Vitals tracking and analytics
- **Bundle Analysis** - Automated bundle size reporting

## 🚀 Deployment

### Build Process

```bash
# Production build
npm run build

# Preview build locally
npm run preview

# Type checking
npm run type-check

# Run all quality checks
npm run lint && npm run test && npm run type-check
```

### Deployment Targets

- **Vercel** (Recommended) - Optimized for React applications
- **Netlify** - JAMstack deployment with form handling
- **AWS S3 + CloudFront** - Enterprise-level static hosting
- **Docker** - Containerized deployment for any environment

## 🤝 Contributing

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards

- **TypeScript** - Strict type checking required
- **ESLint** - All linting rules must pass
- **Prettier** - Code must be formatted
- **Tests** - New features require tests
- **Accessibility** - WCAG 2.1 AA compliance required
- **Documentation** - Code must be documented

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new reading session tracker
fix: resolve achievement unlock bug
docs: update API documentation
style: format code with prettier
refactor: optimize dashboard performance
test: add user authentication tests
chore: update dependencies
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

## 🙏 Acknowledgments

- **shadcn/ui** - Beautiful and accessible component library
- **Supabase** - Backend-as-a-Service platform
- **Tailwind CSS** - Utility-first CSS framework
- **React Query** - Powerful data synchronization
- **Framer Motion** - Production-ready motion library
- **Testing Library** - Simple and complete testing utilities

---

<div align="center">
  <p>Built with ❤️ by the BiblioGame Zone team</p>
  <p>
    <a href="#-overview">Overview</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-development">Development</a> •
    <a href="#-contributing">Contributing</a>
  </p>
</div>
